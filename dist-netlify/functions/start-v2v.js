import { MODELS, detectIsVideo } from './models';
const AIML_API_URL = process.env.AIML_API_URL;
const AIML_API_KEY = process.env.AIML_API_KEY;
function safeParse(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return { raw: text };
    }
}
function normalizeCloudinaryUrl(url) {
    if (!url?.includes('res.cloudinary.com'))
        return url;
    // Force vendor-friendly MP4/H.264 URL when it's a Cloudinary MOV/HEVC
    return url
        .replace('/upload/', '/upload/f_mp4,vc_h264,q_auto/')
        .replace(/\.mov(\?|$)/i, '.mp4$1');
}
export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        // Always set the model explicitly (don't rely on vendor defaults)
        const sourceUrl = body.video_url || body.image_url || body.source_url || body.url;
        if (!sourceUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'No source URL provided',
                    expected: 'video_url, image_url, source_url, or url',
                    received: Object.keys(body)
                })
            };
        }
        // Explicit video detection - don't infer from other fields
        const isVideo = detectIsVideo(sourceUrl) || body.isVideo === true;
        const model = isVideo ? MODELS.V2V : MODELS.I2V;
        console.log(`[start-v2v] Explicit model selection:`, {
            sourceUrl: sourceUrl.substring(0, 60) + '...',
            isVideo,
            model,
            detection: 'explicit'
        });
        // Force vendor-compatible URL
        const normalizedUrl = normalizeCloudinaryUrl(sourceUrl);
        // Build CLEAN payload: only send keys the vendor expects
        const base = {
            model, // <- REQUIRED so we don't fall back to I2V
            prompt: body.prompt || 'Enhance this content',
            fps: Math.min(60, Math.max(1, body.fps || 24)),
            duration: Math.min(10, Math.max(1, body.duration || 5)), // Kling supports 5 or 10
            stabilization: !!body.stabilization,
        };
        // Use correct URL key for the model type
        const payload = isVideo
            ? { ...base, video_url: normalizedUrl } // V2V: use video_url
            : { ...base, image_url: normalizedUrl }; // I2V: use image_url
        console.log(`[start-v2v] Clean payload:`, {
            model: payload.model,
            keys: Object.keys(payload),
            urlKey: isVideo ? 'video_url' : 'image_url',
            isVideo
        });
        // DO NOT send internal fields (resource_type, visibility, source, etc.)
        const res = await fetch(`${AIML_API_URL}/v2/generate/video/kling/generation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${AIML_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });
        const text = await res.text();
        if (!res.ok) {
            console.error(`[start-v2v] Vendor rejected (${res.status}):`, text);
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Vendor rejected start',
                    status: res.status,
                    details: safeParse(text),
                    sent: {
                        model,
                        keys: Object.keys(payload),
                        isVideo,
                        urlKey: isVideo ? 'video_url' : 'image_url'
                    },
                }),
            };
        }
        const data = safeParse(text);
        const job_id = data.generation_id || data.id || data.request_id || data.task_id;
        if (!job_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'No job ID in vendor response',
                    vendor_response: data,
                    model
                })
            };
        }
        console.log(`[start-v2v] Success:`, { job_id, model, isVideo });
        // Return model separately; don't bake it into the ID
        return {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                job_id,
                model,
                vendor: `kling-v1.6-${isVideo ? 'v2v' : 'i2v'}`,
                debug: { isVideo, model_used: model }
            })
        };
    }
    catch (err) {
        console.error('[start-v2v] Exception:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'start-v2v crashed',
                details: err?.message || String(err),
                stack: err?.stack?.split('\n').slice(0, 3)
            })
        };
    }
};
