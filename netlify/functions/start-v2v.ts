// netlify/functions/start-v2v.ts
import type { Handler } from '@netlify/functions';

const AIML_API_URL = process.env.AIML_API_URL!;
const AIML_API_KEY = process.env.AIML_API_KEY!;

// Helper to pick first non-empty string value from object keys
const pick = (obj: any, keys: string[]) =>
  keys.map(k => obj?.[k]).find(v => typeof v === 'string' && v);

// Detect if URL looks like a video based on path or extension
const looksLikeVideoUrl = (s?: string) =>
  typeof s === 'string' && (
    /\/video\/upload\//.test(s) || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(s)
  );

// Convert Cloudinary video URL to first frame image for I2V
const firstFrameFromCloudinary = (videoUrl: string) => {
  if (!/res\.cloudinary\.com\/.+\/video\/upload\//.test(videoUrl)) return videoUrl;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0,f_jpg/')
    .replace(/\.mp4(\?.*)?$/i, '.jpg$1');
};

const clampDuration = (n?: number) => (n && n >= 10 ? 10 : 5);

export const handler: Handler = async (evt) => {
  try {
    const body = JSON.parse(evt.body || '{}');
    const prompt = body.prompt || body.effectivePrompt || 'Enhance with cinematic look';
    
    // Accept multiple aliases; prefer explicit video_url
    const source = body.video_url ||
                  body.source_url ||
                  body.url ||
                  body.image_url || // legacy - might be video sent under wrong key
                  pick(evt.queryStringParameters || {}, ['video_url', 'source_url', 'url', 'image_url']) ||
                  null;

    if (!source) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'No source provided',
          received_keys: Object.keys(body || {}),
        }),
      };
    }

    // Determine if this is video-to-video or image-to-video
    // Be forgiving - detect videos even if sent under image_url key
    const isVideo = body.resource_type === 'video' || looksLikeVideoUrl(source);

    // Build provider model + payload
    const MODEL_BASE = 'kling-video/v1.6/standard';
    const task = isVideo ? 'video-to-video' : 'image-to-video';
    const model = `${MODEL_BASE}/${task}`;

    // Normalize payload keys based on detected type
    const providerPayload: any = {
      model,
      prompt,
      duration: clampDuration(Number(body.duration)),
      ...(body.negative_prompt ? { negative_prompt: body.negative_prompt } : {}),
    };

    if (isVideo) {
      // True V2V: send video_url directly
      providerPayload.video_url = source;
    } else {
      // I2V: send image_url (or convert video to first frame)
      providerPayload.image_url = looksLikeVideoUrl(source) ? firstFrameFromCloudinary(source) : source;
    }

    const res = await fetch(`${AIML_API_URL}/v2/generate/video/kling/generation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(providerPayload),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({
          message: `Vendor error creating Kling ${task} job`,
          body: text,
        }),
      };
    }

    const json = JSON.parse(text || '{}');
    const job_id = json.generation_id || json.id || json.request_id || json.task_id;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job_id,
        model, // ✅ Return the model so client can poll correctly
        vendor: `kling-v1.6-${isVideo ? 'v2v' : 'i2v'}`,
        raw: json
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'start-v2v crashed', detail: String(err) }),
    };
  }
};
