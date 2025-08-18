export async function uploadSourceToCloudinary(src) {
    const NO_DB_MODE = import.meta.env.VITE_NO_DB_MODE === 'true'; // for gating later calls
    // 1) prefer the original File object
    const isFile = !!src.file;
    if (!isFile && src.url && (src.url.startsWith('blob:') || src.url.startsWith('data:'))) {
        // Borrow the last user-selected file if available
        const f = window.__lastSelectedFile;
        if (f) {
            console.warn('uploadSource: blob URL detected, falling back to last selected file');
            src = { file: f };
        }
        else {
            throw new Error('Pass the original File, not a blob/data URL');
        }
    }
    // 2) get a fresh signature
    const { signedFetch } = await import('../lib/auth');
    const sign = await signedFetch('/.netlify/functions/cloudinary-sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ folder: 'stefna/sources' }),
    }).then(r => r.json());
    const form = new FormData();
    form.append('timestamp', String(sign.timestamp));
    form.append('folder', sign.folder);
    form.append('api_key', sign.api_key);
    form.append('signature', sign.signature);
    // 3) File → binary upload (best). HTTP(S) → remote URL (also fine).
    if (isFile)
        form.append('file', src.file);
    else
        form.append('file', src.url); // must be https
    let res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, {
        method: 'POST',
        body: form,
    });
    // Optional dev fallback to unsigned preset to keep you moving
    if (!res.ok) {
        const text = await res.text();
        if (/Invalid Signature/.test(text) && import.meta.env.DEV) {
            const fd = new FormData();
            fd.append('upload_preset', import.meta.env.VITE_CLD_UNSIGNED_PRESET); // e.g. "unsigned-dev-sources"
            if (isFile)
                fd.append('file', src.file);
            else
                fd.append('file', src.url);
            res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, { method: 'POST', body: fd });
        }
        else {
            throw new Error(text);
        }
    }
    const json = await res.json();
    return { secureUrl: json.secure_url, publicId: json.public_id };
}
