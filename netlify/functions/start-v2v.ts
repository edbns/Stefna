// netlify/functions/start-v2v.ts
import type { Handler } from '@netlify/functions';

const AIML_API_URL = process.env.AIML_API_URL!;
const AIML_API_KEY = process.env.AIML_API_KEY!;

type StartReq = {
  prompt?: string;
  image_url?: string;    // legacy
  video_url?: string;    // preferred for v2v
  url?: string;          // extra alias
  source_url?: string;   // extra alias
  resource_type?: 'image' | 'video';
  duration?: number;
  fps?: number;
  quality?: 'low' | 'medium' | 'high';
  stabilization?: boolean;
  negative_prompt?: string;
};

const looksLikeVideo = (url?: string) =>
  typeof url === 'string' &&
  (/\/video\/upload\//.test(url) || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url));

function resp(statusCode: number, body: unknown) {
  return { statusCode, body: JSON.stringify(body) };
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number(n) || min));
}

export const handler: Handler = async (evt) => {
  try {
    const body: StartReq = JSON.parse(evt.body || '{}');

    // Unify source - accept multiple aliases
    const source =
      body.video_url ||
      body.source_url ||
      body.url ||
      body.image_url ||
      null;

    if (!source) {
      return resp(400, { 
        ok: false, 
        error: 'No source provided',
        received_keys: Object.keys(body || {}),
        debug: 'Expected video_url, source_url, url, or image_url'
      });
    }

    const isVideo =
      body.resource_type === 'video' || looksLikeVideo(source);

    // Choose model explicitly
    const BASE = 'kling-video/v1.6/standard';
    const model = `${BASE}/${isVideo ? 'video-to-video' : 'image-to-video'}`;

    // Vendor payload
    const payload: Record<string, unknown> = {
      model,
      prompt: body.prompt ?? 'Enhance with cinematic look',
      duration: clampNum(body.duration ?? 5, 1, 10), // Kling supports 5 or 10
      fps: clampNum(body.fps ?? 24, 1, 60),
      quality: body.quality ?? 'high',
      stabilization: !!body.stabilization,
      ...(isVideo ? { video_url: source } : { image_url: source }),
      ...(body.negative_prompt ? { negative_prompt: body.negative_prompt } : {}),
    };

    console.log(`[start-v2v] Calling vendor with model: ${model}`, {
      isVideo,
      source: source.substring(0, 50) + '...',
      payload_keys: Object.keys(payload)
    });

    // Call vendor API
    const res = await fetch(`${AIML_API_URL}/v2/generate/video/kling/generation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    
    if (!res.ok) {
      // Surface vendor errors transparently
      console.error(`[start-v2v] Vendor error ${res.status}:`, text);
      return resp(res.status, {
        ok: false,
        error: `Vendor error creating Kling ${isVideo ? 'V2V' : 'I2V'} job`,
        vendor_status: res.status,
        vendor_response: text,
        model_used: model,
        debug: 'Check if AIML API supports this model/payload combination'
      });
    }

    const json = JSON.parse(text || '{}');
    const job_id = json.generation_id || json.id || json.request_id || json.task_id;

    if (!job_id) {
      return resp(400, {
        ok: false,
        error: 'No job ID in vendor response',
        vendor_response: json,
        model_used: model
      });
    }

    console.log(`[start-v2v] Success: job_id=${job_id}, model=${model}`);

    // Return model so the client knows what to poll
    return resp(200, { 
      ok: true, 
      job_id, 
      model,
      vendor: `kling-v1.6-${isVideo ? 'v2v' : 'i2v'}`,
      debug: { isVideo, source_type: isVideo ? 'video' : 'image' }
    });
  } catch (err: any) {
    // Surface meaningful errors to the client for debugging
    console.error('[start-v2v] Exception:', err);
    const details = err?.response?.data || err?.message || String(err);
    return resp(500, { 
      ok: false, 
      error: 'start-v2v crashed', 
      details,
      stack: err?.stack?.split('\n').slice(0, 3) // First few lines of stack
    });
  }
};
