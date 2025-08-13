export async function createAsset(input: import('./types').CreateAssetInput) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch('/.netlify/functions/create-asset', {
    method: 'POST',
    headers: token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function processAsset(payload: import('./types').ProcessAssetPayload) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch('/.netlify/functions/process-asset', {
    method: 'POST',
    headers: token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function publishAsset(input: import('./types').PublishAssetInput) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch('/.netlify/functions/publish-asset', {
    method: 'POST',
    headers: token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' },
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
    headers: { 'content-type': 'application/json' },
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
  const res = await fetch(`/.netlify/functions/save-media`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error || 'save-media failed');
  return body.data as { public_id: string; resource_type: string; url: string; created_at: string };
}

export async function togglePublish(publicId: string, publish: boolean) {
  const res = await fetch(`/.netlify/functions/togglePublish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ publicId, publish }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error || 'togglePublish failed');
  return true;
}
