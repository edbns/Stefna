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
  // 🆕 [New System] All media saving now goes through dedicated generation functions
  console.log('🆕 [New System] Media saving handled by dedicated functions - no old save-media needed');
  throw new Error('Direct media saving is deprecated - use dedicated generation functions');
}


