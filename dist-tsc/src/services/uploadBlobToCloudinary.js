// src/services/uploadBlobToCloudinary.ts
import { signedFetch } from '../lib/auth';
export async function uploadBlobToCloudinary(opts) {
    // reuse your existing signing endpoint
    const sign = await signedFetch('/.netlify/functions/cloudinary-sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ folder: opts.folder ?? 'stefna/outputs' })
    }).then(r => r.json());
    const fd = new FormData();
    fd.append('file', opts.blob);
    fd.append('timestamp', sign.timestamp);
    fd.append('signature', sign.signature);
    fd.append('api_key', sign.apiKey);
    fd.append('folder', opts.folder ?? 'stefna/outputs');
    const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, {
        method: 'POST',
        body: fd,
    });
    if (!up.ok)
        throw new Error(`Cloudinary upload failed: ${up.status}`);
    const j = await up.json();
    return { secureUrl: j.secure_url, publicId: j.public_id };
}
