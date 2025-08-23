// src/lib/api.ts
import { getAuthHeaders } from './auth'

export async function createAsset(input: import('./types').CreateAssetInput) {
  const res = await fetch('/.netlify/functions/create-asset', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function processAsset(payload: import('./types').ProcessAssetPayload) {
  const res = await fetch('/.netlify/functions/process-asset', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function publishAsset(input: import('./types').PublishAssetInput) {
  const res = await fetch('/.netlify/functions/publish-asset', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function getPublicFeed(limit = 20, offset = 0) {
  const res = await fetch(`/.netlify/functions/getPublicFeed?limit=${limit}&offset=${offset}`);
  return res.json();
}

export async function getUserMedia(userId: string) {
  const res = await fetch(`/.netlify/functions/getUserMedia`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error || 'getUserMedia failed');
  return body.items || body.data || [];
}

export async function saveMedia(params: {
  resultUrl: string;
  userId: string;
  presetKey?: string | null;
  sourcePublicId?: string | null;
  // allowRemix removed
  shareNow?: boolean;
  mediaTypeHint?: 'image' | 'video';
}) {
  // Convert to the new save-media format with variations array
  const savePayload = {
    runId: crypto.randomUUID(), // Use global crypto object
    presetId: params.presetKey,
    allowPublish: params.shareNow || false,
    source: params.sourcePublicId ? { url: params.sourcePublicId } : undefined,
    variations: [{
      url: params.resultUrl,
      type: params.mediaTypeHint || 'image',
      meta: {
        presetKey: params.presetKey,
        userId: params.userId,
        // allowRemix removed
        shareNow: params.shareNow,
        source: 'database'
      }
    }],
    tags: ['transformed', 'database'],
    extra: {
      source: 'database',
      timestamp: new Date().toISOString(),
      userId: params.userId
    }
  };

  const res = await fetch(`/.netlify/functions/save-media`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(savePayload),
  });
  const text = await res.text();
  let body: any = {};
  try { body = JSON.parse(text); } catch { /* leave as text */ }
  if (!res.ok || body?.ok === false) {
    const msg = (body && body.error) ? body.error : (text || 'save-media failed');
    throw new Error(msg);
  }
  return (body?.data ?? {}) as { public_id: string; resource_type: string; url: string; created_at: string };
}

export async function togglePublish(publicId: string, publish: boolean) {
  const res = await fetch(`/.netlify/functions/togglePublish`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ publicId, publish }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error || 'togglePublish failed');
  return true;
}
