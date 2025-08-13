// netlify/functions/poll-v2v.ts
import type { Handler } from '@netlify/functions';

const AIML_API_URL = process.env.AIML_API_URL!;
const AIML_API_KEY = process.env.AIML_API_KEY!;

export const handler: Handler = async (evt) => {
  try {
    const qs = evt.queryStringParameters || {};
    let jobId = qs.id || '';
    let model = qs.model || '';
    const persist = qs.persist === 'true';

    // Back-compat: if id carries model after a colon, split it out
    if (!model && jobId.includes(':')) {
      const parts = jobId.split(':');
      jobId = parts[0];
      model = parts.slice(1).join(':'); // in case model has colons
    }

    // Final fallback (prefer video-to-video on V2V endpoint)
    if (!model) model = 'kling-video/v1.6/standard/video-to-video';

    if (!jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'missing job id' }) };
    }

    const url = `${AIML_API_URL}/v2/generate/video/kling/generation?generation_id=${encodeURIComponent(jobId)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIML_API_KEY}` },
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ message: 'Vendor polling error', body: text }),
      };
    }
    const data = JSON.parse(text || '{}');

    // Normalize status fields
    const status = String(
      data.status || data.state || (data.video_url || data.content?.url ? 'completed' : ''),
    ).toLowerCase();

    if (status === 'failed' || status === 'error') {
      const error = data.error || data.message || text || 'Unknown error';
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, status: 'failed', job_id: jobId, error }),
      };
    }

    if (status !== 'completed') {
      const progress = data.progress ?? data.percent ?? data.meta?.progress;
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, status: 'processing', job_id: jobId, progress }),
      };
    }

    // Completed: extract result URL
    const resultUrl = data.video_url || data.content?.url || data.url;
    if (!resultUrl) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, status: 'failed', job_id: jobId, error: 'No resultUrl in response' }),
      };
    }

    if (!persist) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          status: 'completed',
          job_id: jobId,
          data: { mediaType: 'video', resultUrl, publicId: null },
        }),
      };
    }

    // Persist to Cloudinary as VIDEO
    const uploadRes = await fetch(`${evt.headers.origin}/.netlify/functions/save-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: resultUrl,
        resource_type: 'video',
        tags: ['aiml', 'kling', model.includes('video-to-video') ? 'v2v' : 'i2v', jobId],
        visibility: 'public',
      }),
    }).then((r) => r.json());

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        status: 'completed',
        job_id: jobId,
        data: { mediaType: 'video', resultUrl, publicId: uploadRes.public_id },
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, status: 'failed', error: String(err) }),
    };
  }
};