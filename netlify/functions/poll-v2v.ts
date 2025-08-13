// netlify/functions/poll-v2v.ts
import type { Handler } from '@netlify/functions';

const AIML_API_URL = process.env.AIML_API_URL!;
const AIML_API_KEY = process.env.AIML_API_KEY!;

const getQuery = (evt: any) => {
  const q = new URLSearchParams(evt.rawQuery || evt.queryStringParameters || {});
  return {
    id: q.get('id') || q.get('job_id') || q.get('task_id') || '',
    persist: q.get('persist') === 'true',
  };
};

export const handler: Handler = async (evt) => {
  try {
    const { id, persist } = getQuery(evt);
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'missing id' }) };

    const url = `${AIML_API_URL}/v2/generate/video/kling/generation?generation_id=${encodeURIComponent(
      id,
    )}`;

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

    const status = String(
      data.status || data.state || (data.video_url || data.content?.url ? 'completed' : ''),
    ).toLowerCase();

    if (status === 'completed') {
      const resultUrl = data.video_url || data.content?.url || data.url;
      if (!resultUrl) {
        return {
          statusCode: 200,
          body: JSON.stringify({ status: 'failed', error: 'No resultUrl in response' }),
        };
      }

      if (!persist) {
        return { statusCode: 200, body: JSON.stringify({ status: 'completed', resultUrl }) };
      }

      // persist to Cloudinary (expects your existing signed upload helper)
      const uploadRes = await fetch(`${evt.headers.origin}/.netlify/functions/save-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: resultUrl,
          resource_type: 'video',
          tags: ['aiml', 'kling', 'i2v', id],
          visibility: 'public',
        }),
      }).then((r) => r.json());

      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'completed', publicId: uploadRes.public_id }),
      };
    }

    if (status === 'failed' || status === 'error') {
      return { statusCode: 200, body: JSON.stringify({ status: 'failed', error: data }) };
    }

    return { statusCode: 200, body: JSON.stringify({ status: 'processing' }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ status: 'failed', error: String(err) }) };
  }
};