"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/start-v2v.ts
var start_v2v_exports = {};
__export(start_v2v_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(start_v2v_exports);

// netlify/functions/models.ts
var MODELS = {
  I2V_STD: "kling-video/v1.6/standard/image-to-video",
  I2V_PRO: "kling-video/v1.6/pro/image-to-video"
};
function detectIsVideo(url) {
  return !!url && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

// netlify/functions/start-v2v.ts
var AIML_API_URL = process.env.AIML_API_URL;
var AIML_API_KEY = process.env.AIML_API_KEY;
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
function normalizeCloudinaryUrl(url) {
  if (!url?.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/f_mp4,vc_h264,q_auto/").replace(/\.mov(\?|$)/i, ".mp4$1");
}
var handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const sourceUrl = body.video_url || body.image_url || body.source_url || body.url;
    if (!sourceUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No source URL provided",
          expected: "video_url, image_url, source_url, or url",
          received: Object.keys(body)
        })
      };
    }
    const isVideo = detectIsVideo(sourceUrl) || body.isVideo === true;
    const model = isVideo ? MODELS.V2V : MODELS.I2V;
    console.log(`[start-v2v] Explicit model selection:`, {
      sourceUrl: sourceUrl.substring(0, 60) + "...",
      isVideo,
      model,
      detection: "explicit"
    });
    const normalizedUrl = normalizeCloudinaryUrl(sourceUrl);
    const base = {
      model,
      // <- REQUIRED so we don't fall back to I2V
      prompt: body.prompt || "Enhance this content",
      fps: Math.min(60, Math.max(1, body.fps || 24)),
      duration: Math.min(10, Math.max(1, body.duration || 5)),
      // Kling supports 5 or 10
      stabilization: !!body.stabilization
    };
    const payload = isVideo ? { ...base, video_url: normalizedUrl } : { ...base, image_url: normalizedUrl };
    console.log(`[start-v2v] Clean payload:`, {
      model: payload.model,
      keys: Object.keys(payload),
      urlKey: isVideo ? "video_url" : "image_url",
      isVideo
    });
    const res = await fetch(`${AIML_API_URL}/v2/generate/video/kling/generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AIML_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[start-v2v] Vendor rejected (${res.status}):`, text);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Vendor rejected start",
          status: res.status,
          details: safeParse(text),
          sent: {
            model,
            keys: Object.keys(payload),
            isVideo,
            urlKey: isVideo ? "video_url" : "image_url"
          }
        })
      };
    }
    const data = safeParse(text);
    const job_id = data.generation_id || data.id || data.request_id || data.task_id;
    if (!job_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No job ID in vendor response",
          vendor_response: data,
          model
        })
      };
    }
    console.log(`[start-v2v] Success:`, { job_id, model, isVideo });
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job_id,
        model,
        vendor: `kling-v1.6-${isVideo ? "v2v" : "i2v"}`,
        debug: { isVideo, model_used: model }
      })
    };
  } catch (err) {
    console.error("[start-v2v] Exception:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "start-v2v crashed",
        details: err?.message || String(err),
        stack: err?.stack?.split("\n").slice(0, 3)
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=start-v2v.js.map
