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
