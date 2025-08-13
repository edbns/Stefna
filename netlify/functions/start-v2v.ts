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

// Vendor route mapping
const ROUTES = {
  I2V: '/v2/generate/video/kling/generation',  // Kling image-to-video
  V2V: '/v2/generate/video/kling/generation',  // Kling video-to-video (same endpoint, different model)
};

const looksLikeVideo = (url?: string) =>
  typeof url === 'string' &&
  (/\/video\/upload\//.test(url) || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url));

function ok(body: any) { return { statusCode: 200, body: JSON.stringify(body) }; }
function bad(body: any) { return { statusCode: 400, body: JSON.stringify(body) }; }

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number(n) || min));
}

// Ensure Cloudinary URL is vendor-compatible (mp4/H.264)
function makeVendorCompatibleUrl(url: string): string {
  if (!url.includes('cloudinary.com')) return url;
  
  // Force mp4 with H.264 codec for better vendor compatibility
  if (url.includes('/video/upload/')) {
    // Insert transformation parameters before the public_id
    return url.replace('/video/upload/', '/video/upload/f_mp4,vc_h264,q_auto/');
  }
  return url;
}

export const handler: Handler = async (evt) => {
  try {
    const body: StartReq = JSON.parse(evt.body || '{}');

    // Unify source - accept multiple aliases
    const rawSource =
      body.video_url ||
      body.source_url ||
      body.url ||
      body.image_url ||
      null;

    if (!rawSource) {
      return bad({ 
        error: 'No source provided',
        received_keys: Object.keys(body || {}),
        debug: 'Expected video_url, source_url, url, or image_url'
      });
    }

    const isVideo = body.resource_type === 'video' || looksLikeVideo(rawSource);
    
    // Make URL vendor-compatible (force mp4/H.264 for videos)
    const source = makeVendorCompatibleUrl(rawSource);

    // Choose model and route
    const BASE = 'kling-video/v1.6/standard';
    const model = `${BASE}/${isVideo ? 'video-to-video' : 'image-to-video'}`;
    const route = isVideo ? ROUTES.V2V : ROUTES.I2V;
    const url = AIML_API_URL + route;

    // Base payload
    const base = {
      model,
      prompt: body.prompt ?? 'Enhance with cinematic look',
      duration: clampNum(body.duration ?? 5, 5, 10), // Kling only supports 5 or 10
      fps: clampNum(body.fps ?? 24, 1, 60),
      quality: body.quality ?? 'high',
      stabilization: !!body.stabilization,
      ...(body.negative_prompt ? { negative_prompt: body.negative_prompt } : {}),
    };

    // Try multiple payload variants (different vendors use different keys)
    const candidates = isVideo
      ? [
          { ...base, video_url: source },
          { ...base, init_video_url: source },
          { ...base, reference_video: source },
          { ...base, input_video: source },
        ]
      : [
          { ...base, image_url: source },
          { ...base, init_image_url: source },
          { ...base, input_image: source },
        ];

    console.log(`[start-v2v] Trying ${candidates.length} payload variants for ${isVideo ? 'V2V' : 'I2V'}`, {
      model,
      url,
      source: source.substring(0, 60) + '...',
      isVideo
    });

    let lastErr: any;
    for (let i = 0; i < candidates.length; i++) {
      const payload = candidates[i];
      try {
        console.log(`[start-v2v] Attempt ${i + 1}: ${Object.keys(payload).join(', ')}`);
        
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIML_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        
        if (res.ok) {
          const data = JSON.parse(text || '{}');
          const job_id = data.generation_id || data.id || data.request_id || data.task_id;
          
          if (!job_id) {
            lastErr = { status: res.status, error: 'No job ID in response', response: data };
          continue;
          }

          console.log(`[start-v2v] Success on attempt ${i + 1}: job_id=${job_id}, model=${model}`);
          
          return ok({ 
            ok: true, 
            job_id, 
            model,
            vendor: `kling-v1.6-${isVideo ? 'v2v' : 'i2v'}`,
            successful_payload: Object.keys(payload).filter(k => k.includes('url') || k.includes('video') || k.includes('image'))
          });
        } else {
          // Parse vendor error
          let vendorData;
          try {
            vendorData = JSON.parse(text);
          } catch {
            vendorData = text;
          }
          
          lastErr = { 
            status: res.status, 
            vendor_response: vendorData,
            payload_keys: Object.keys(payload),
            attempt: i + 1
          };
          
          console.log(`[start-v2v] Attempt ${i + 1} failed (${res.status}):`, vendorData);
        }
      } catch (e: any) {
        lastErr = { 
          message: e?.message, 
          payload_keys: Object.keys(payload),
          attempt: i + 1
        };
        console.log(`[start-v2v] Attempt ${i + 1} crashed:`, e?.message);
      }
    }

    // All attempts failed - return the last error with full details
    return bad({ 
      error: 'All vendor payload variants rejected', 
      model_used: model,
      url_used: url,
      source_url: source,
      total_attempts: candidates.length,
      last_error: lastErr,
      debug: 'Check vendor documentation for correct payload format'
    });

  } catch (err: any) {
    console.error('[start-v2v] Exception:', err);
    return bad({ 
      error: 'start-v2v crashed', 
      details: err?.message || String(err),
      stack: err?.stack?.split('\n').slice(0, 3)
    });
  }
};
