// utils/ensureRemoteUrl.ts
import { signedFetch } from '../lib/auth';

export async function ensureRemoteUrl(asset: { remoteUrl?: string; file?: File|Blob; url?: string; blobUrl?: string }) {
  const direct = asset?.remoteUrl || asset?.url || asset?.blobUrl;
  if (direct?.startsWith('https://')) return direct;

  // If we have a file/blob object, use it directly
  if (asset?.file) {
    // Upload the file to Cloudinary
    const sigRes = await signedFetch('/.netlify/functions/cloudinary-sign', { method: 'POST' });
    const sig = await sigRes.json(); // { signature, timestamp, cloudName, apiKey, folder }
    if (!sig?.signature) throw new Error('Cloudinary sign failed');

    const form = new FormData();
    form.append('file', asset.file);
    if (sig.folder) form.append('folder', sig.folder);
    form.append('timestamp', String(sig.timestamp));
    form.append('api_key', sig.apiKey);
    form.append('signature', sig.signature);

    const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: 'POST', body: form });
    const body = await up.json();
    if (!up.ok || !body?.secure_url) throw new Error('Upload failed');
    return body.secure_url as string;
  }

  // If we only have a blob URL but no file object, we can't proceed
  if (asset?.blobUrl) {
    throw new Error('Cannot process blob URL without File/Blob object. Please pass the actual file.');
  }

  throw new Error('No valid source found. Need either https URL, File/Blob object, or remote URL.');
}
