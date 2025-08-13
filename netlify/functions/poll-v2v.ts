// netlify/functions/poll-v2v.ts - Clean polling with separate id and model params
import type { Handler } from '@netlify/functions';

const AIML_API_URL = process.env.AIML_API_URL!;
const AIML_API_KEY = process.env.AIML_API_KEY!;

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export const handler: Handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {};
    const { id, model, persist, prompt } = qs;

    if (!id || !model) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing id or model',
          expected: '?id=<jobId>&model=<model>&persist=true',
          received: { id: !!id, model: !!model, keys: Object.keys(qs) }
        })
      };
    }

    console.log(`[poll-v2v] Polling:`, { 
      job_id: id, 
      model: model.substring(0, 40) + '...', 
      persist: persist === 'true' 
    });

    // Poll the vendor with the exact model used
    const url = `${AIML_API_URL}/v2/generate/video/kling/generation?generation_id=${encodeURIComponent(id)}`;
    
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
    });

    const text = await res.text();
    
    if (!res.ok) {
      console.error(`[poll-v2v] Vendor poll failed (${res.status}):`, text);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Vendor poll failed',
          status: res.status,
          details: safeParse(text),
          job_id: id,
          model
        })
      };
    }

    const data = safeParse(text);

    // Normalize status fields
    const status = String(
      data.status || data.state || (data.video_url || data.content?.url ? 'completed' : '')
    ).toLowerCase();

    console.log(`[poll-v2v] Status: ${status} for job ${id}`);

    if (status === 'failed' || status === 'error') {
      const error = data.error || data.message || text || 'Unknown error';
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          ok: false, 
          status: 'failed', 
          job_id: id, 
          error,
          model 
        }),
      };
    }

    if (status !== 'completed') {
      const progress = data.progress ?? data.percent ?? data.meta?.progress;
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          ok: true, 
          status: 'processing', 
          job_id: id, 
          progress,
          model 
        }),
      };
    }

    // Completed: extract result URL
    const resultUrl = data.video_url || data.content?.url || data.url;
    if (!resultUrl) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          ok: false, 
          status: 'failed', 
          job_id: id, 
          error: 'No resultUrl in vendor response',
          model,
          vendor_response: data
        }),
      };
    }

    if (persist !== 'true') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          status: 'completed',
          job_id: id,
          data: { mediaType: 'video', resultUrl, publicId: null },
          model
        }),
      };
    }

    // Persist to Cloudinary as VIDEO
    const uploadPayload = {
      url: resultUrl,
      resource_type: 'video',
      tags: ['aiml', 'kling', model.includes('video-to-video') ? 'v2v' : 'i2v', id],
      visibility: 'public',
      prompt: prompt || 'AI Generated Video',
    };

    console.log(`[poll-v2v] Persisting to Cloudinary:`, { 
      resultUrl: resultUrl.substring(0, 60) + '...', 
      model: model.substring(0, 40) + '...', 
      job_id: id 
    });

    const uploadRes = await fetch(`${event.headers.origin}/.netlify/functions/save-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadPayload),
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error(`[poll-v2v] save-media failed (${uploadRes.status}):`, errorText);
      // Still return success with vendor URL so UI can show result
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          status: 'completed',
          job_id: id,
          data: { 
            mediaType: 'video', 
            resultUrl, 
            publicId: null,
            note: 'cloudinary-upload-failed'
          },
          model
        }),
      };
    }

    const uploadData = await uploadRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        status: 'completed',
        job_id: id,
        data: { mediaType: 'video', resultUrl, publicId: uploadData.public_id },
        model
      }),
    };

  } catch (err: any) {
    console.error('[poll-v2v] Exception:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        status: 'failed',
        error: 'poll-v2v crashed',
        details: err?.message || String(err),
        stack: err?.stack?.split('\n').slice(0, 3)
      }),
    };
  }
};