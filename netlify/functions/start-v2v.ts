// netlify/functions/start-v2v.ts
import type { Handler } from '@netlify/functions';

const AIML_API_URL = process.env.AIML_API_URL!;
const AIML_API_KEY = process.env.AIML_API_KEY!;

const firstFrameFromCloudinary = (videoUrl: string) => {
  // turns .../video/upload/.../foo.mp4 -> .../video/upload/so_0,f_jpg/.../foo.jpg
  if (!/res\.cloudinary\.com\/.+\/video\/upload\//.test(videoUrl)) return videoUrl;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0,f_jpg/')
    .replace(/\.mp4(\?.*)?$/i, '.jpg$1');
};

const clampDuration = (n?: number) => (n && n >= 10 ? 10 : 5);

export const handler: Handler = async (evt) => {
  try {
    const body = JSON.parse(evt.body || '{}');
    const prompt =
      body.prompt || body.effectivePrompt || 'Enhance video with cinematic look';
    const src =
      body.video_url ||
      body.input_video ||
      body.input_url ||
      body.source ||
      body.image_url;

    if (!src) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No video source provided' }),
      };
    }

    // 1) turn source video into an image poster for i2v
    const image_url = firstFrameFromCloudinary(src);

    // 2) create Kling i2v job
    const payload = {
      model: 'kling-video/v1.6/standard/image-to-video', // per AIML docs
      image_url,
      prompt,
      duration: clampDuration(Number(body.duration)), // Kling supports 5 or 10s
      ...(body.negative_prompt ? { negative_prompt: body.negative_prompt } : {}),
    };

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
      return {
        statusCode: res.status,
        body: JSON.stringify({
          message: 'Vendor error creating Kling i2v job',
          body: text,
        }),
      };
    }

    const json = JSON.parse(text || '{}');
    const job_id =
      json.generation_id || json.id || json.request_id || json.task_id;

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, job_id, vendor: 'kling-v1.6-i2v', raw: json }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'start-v2v crashed', detail: String(err) }),
    };
  }
};
