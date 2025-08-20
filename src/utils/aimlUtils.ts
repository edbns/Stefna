// AIML API utility functions for building payloads and parsing results
import { signedFetch } from '../lib/auth';

type ResourceType = 'image' | 'video';

export function buildEditPayload({
  prompt, 
  sourceUrl, 
  steps, 
  strength, 
  resourceType
}: {
  prompt: string; 
  sourceUrl: string; 
  steps?: number; 
  strength?: number; 
  resourceType: ResourceType;
}) {
  const common = {
    prompt,
    num_inference_steps: steps ?? 36,
  };

  if (resourceType === 'image') {
    return {
      endpoint: '/v1/images/generations',
      body: {
        ...common,
        model: 'stable-diffusion-v35-large',
        image_url: sourceUrl,
        strength: Math.min(Math.max(strength ?? 0.7, 0.4), 0.9),
      }
    };
  }

  // VIDEO-TO-VIDEO: keep the same pattern; adjust the field name to whatever your provider expects.
  return {
    endpoint: '/v1/videos/edits',   // or your provider's V2V path
    body: {
      ...common,
      model: 'video/dev/video-to-video', // placeholder model name; use your actual one
      video_url: sourceUrl,              // some providers still use "input_url"
      strength: Math.min(Math.max(strength ?? 0.7, 0.4), 0.9),
    }
  };
}

/**
 * Pick result URL from any response shape
 * Handles both new and legacy response formats
 */
export function pickResultUrl(body: any): string | null {
  if (!body || typeof body !== 'object') return null;
  return (
    body.image_urls?.[0] || // Primary format - array of URLs
    body.result_url ||
    body.image_url ||
    body.url ||
    (Array.isArray(body.result_urls) && body.result_urls[0]) ||
    null
  );
}

/**
 * Ensure we have a remote URL before calling aimlApi
 * Uploads blob URLs to Cloudinary if needed
 */
export async function ensureRemoteUrl(previewUrl?: string, file?: File | Blob): Promise<string> {
  if (previewUrl && !previewUrl.startsWith('blob:')) return previewUrl;

  if (!file) throw new Error('Invalid asset URL and no file to upload');

  // sign with proper error handling
  const sigRes = await signedFetch('/.netlify/functions/cloudinary-sign', { 
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folder: 'stefna/sources' })
  });
  if (!sigRes.ok) {
    const err = await sigRes.json().catch(() => ({}));
    throw new Error(`Cloudinary sign failed ${sigRes.status}: ${err?.error || 'unknown'}`);
  }
  
  const sig = await sigRes.json();
  if (!sig.cloudName || !sig.signature || !sig.timestamp || !sig.apiKey) {
    throw new Error('Signer returned missing fields');
  }

  // now upload
  const form = new FormData();
  form.append('file', file);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('api_key', sig.apiKey);
  if (sig.folder) form.append('folder', sig.folder);
  
  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: 'POST', body: form });
  if (!up.ok) throw new Error('Cloudinary upload failed');
  
  const j = await up.json();
  if (!j?.secure_url) throw new Error('Cloudinary upload failed');
  return j.secure_url as string;
}
