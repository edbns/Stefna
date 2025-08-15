// utils/ensureRemoteUrl.ts
export async function ensureRemoteUrl(asset: { remoteUrl?: string; file?: File|Blob; url?: string; blobUrl?: string }) {
  const direct = asset?.remoteUrl || asset?.url || asset?.blobUrl;
  if (direct?.startsWith('https://')) return direct;

  // Fallback: upload local/blob to Cloudinary to get a https URL
  const sigRes = await fetch('/.netlify/functions/cloudinary-sign', { method: 'POST' });
  const sig = await sigRes.json(); // { signature, timestamp, cloudName, apiKey, folder }
  if (!sig?.signature) throw new Error('Cloudinary sign failed');

  const source = asset?.file
    ? asset.file
    : await (await fetch(direct)).blob(); // turn blob: objectURL into Blob

  const form = new FormData();
  form.append('file', source);
  if (sig.folder) form.append('folder', sig.folder);
  form.append('timestamp', String(sig.timestamp));
  form.append('api_key', sig.apiKey);
  form.append('signature', sig.signature);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: 'POST', body: form });
  const body = await up.json();
  if (!up.ok || !body?.secure_url) throw new Error('Upload failed');
  return body.secure_url as string;
}
