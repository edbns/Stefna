export async function createAsset(input: import('./types').CreateAssetInput) {
  const res = await fetch('/.netlify/functions/create-asset', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function processAsset(payload: import('./types').ProcessAssetPayload) {
  const res = await fetch('/.netlify/functions/process-asset', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function publishAsset(input: import('./types').PublishAssetInput) {
  const res = await fetch('/.netlify/functions/publish-asset', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}
