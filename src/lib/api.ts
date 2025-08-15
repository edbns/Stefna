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

const NO_DB_MODE = import.meta.env.VITE_NO_DB_MODE === 'true' || (typeof process !== 'undefined' && (process as any).env?.NO_DB_MODE === 'true');

export async function getPublicFeed(limit = 50) {
  if (NO_DB_MODE) {
    const res = await fetch(`/.netlify/functions/getPublicFeed?limit=${limit}`);
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body.error || 'getPublicFeed failed');
    return body.data;
  }
  const res = await fetch('/.netlify/functions/getPublicFeed?limit=' + limit);
  return res.json();
}

export async function getUserMediaNoDB(userId: string) {
  const res = await fetch(`/.netlify/functions/getUserMedia`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error || 'getUserMedia failed');
  return body.data;
}

export async function saveMediaNoDB(params: {
  resultUrl: string;
  userId: string;
  presetKey?: string | null;
  sourcePublicId?: string | null;
  allowRemix?: boolean;
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
        allowRemix: params.allowRemix,
        shareNow: params.shareNow,
        source: 'no-db-mode'
      }
    }],
    tags: ['transformed', 'no-db-mode'],
    extra: {
      source: 'no-db-mode',
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
