import { signedFetch } from '../lib/auth';

export async function prepareSourceAsset(activeFileOrUrl: File | string) {
  // If it's already a public http(s) URL, skip upload.
  if (typeof activeFileOrUrl === 'string' && /^https?:\/\//i.test(activeFileOrUrl)) {
    const resource_type = /\.(mp4|mov|webm)$/i.test(activeFileOrUrl) ? 'video' : 'image';
    return { url: activeFileOrUrl, resource_type };
  }

  // If it's a blob URL string, convert to File first
  let file: File;
  if (typeof activeFileOrUrl === 'string' && activeFileOrUrl.startsWith('blob:')) {
    const resp = await fetch(activeFileOrUrl);
    const blob = await resp.blob();
    const ext = blob.type.startsWith('image/') ? (blob.type.split('/')[1] || 'png') :
                blob.type.startsWith('video/') ? (blob.type.split('/')[1] || 'mp4') : 'bin';
    file = new File([blob], `source.${ext}`, { type: blob.type || 'application/octet-stream' });
  } else {
    file = activeFileOrUrl as File;
  }

  // Signed params
  const signRes = await signedFetch('/.netlify/functions/cloudinary-sign', { 
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folder: 'stefna/sources' })
  });
  const { timestamp, signature, apiKey, cloudName, folder, upload_preset } = await signRes.json();

  const form = new FormData();
  form.append('file', file); // <-- real File now
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('api_key', apiKey);
  if (folder) form.append('folder', folder);
  if (upload_preset) form.append('upload_preset', upload_preset);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: form,
  });

  // Better 400 debug
  const json = await up.json().catch(() => ({} as any));
  if (!up.ok) {
    console.error('Cloudinary upload failed:', json);
    throw new Error('Cloudinary upload failed');
  }

  const resource_type = json.resource_type; // 'image' | 'video'
  return { url: json.secure_url as string, resource_type };
}