// src/lib/api.ts
import { getAuthHeaders } from './auth';
export async function createAsset(input) {
    const res = await fetch('/.netlify/functions/create-asset', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    return res.json();
}
export async function processAsset(payload) {
    const res = await fetch('/.netlify/functions/process-asset', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json();
}
export async function publishAsset(input) {
    const res = await fetch('/.netlify/functions/publish-asset', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    return res.json();
}
export async function getPublicFeed(limit = 50) {
    const res = await fetch('/.netlify/functions/getPublicFeed?limit=' + limit);
    return res.json();
}
export async function getUserMedia(userId) {
    const res = await fetch(`/.netlify/functions/getUserMedia`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok)
        throw new Error(body.error || 'getUserMedia failed');
    return body.items || body.data || [];
}
export async function saveMedia(params) {
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
                    source: 'database'
                }
            }],
        tags: ['transformed', 'database'],
        extra: {
            source: 'database',
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
    let body = {};
    try {
        body = JSON.parse(text);
    }
    catch { /* leave as text */ }
    if (!res.ok || body?.ok === false) {
        const msg = (body && body.error) ? body.error : (text || 'save-media failed');
        throw new Error(msg);
    }
    return (body?.data ?? {});
}
export async function togglePublish(publicId, publish) {
    const res = await fetch(`/.netlify/functions/togglePublish`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ publicId, publish }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok)
        throw new Error(body.error || 'togglePublish failed');
    return true;
}
