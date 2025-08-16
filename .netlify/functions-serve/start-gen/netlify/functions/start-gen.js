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

// netlify/functions/start-gen.ts
var start_gen_exports = {};
__export(start_gen_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(start_gen_exports);

// netlify/functions/models.ts
var MODELS = {
  I2V_STD: "kling-video/v1.6/standard/image-to-video",
  I2V_PRO: "kling-video/v1.6/pro/image-to-video"
};
function detectIsVideo(url) {
  return !!url && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}
function toCloudinaryFrame(url, second = 0, width = 1024) {
  if (!url?.includes("res.cloudinary.com")) return url;
  return url.replace("/video/upload/", `/video/upload/so_${second},w_${width},f_jpg,q_auto/`).replace(/\.(mp4|mov|m4v|webm)(\?|$)/i, ".jpg$2");
}

// netlify/functions/start-gen.ts
var AIML_API_URL = process.env.AIML_API_URL;
var AIML_API_KEY = process.env.AIML_API_KEY;
function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
var handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const sourceUrl = body.video_url || body.image_url || body.url || body.source_url;
    if (!sourceUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No source URL provided",
          expected: "video_url, image_url, url, or source_url",
          received: Object.keys(body)
        })
      };
    }
    const isVideoUpload = detectIsVideo(sourceUrl);
    const imageUrl = isVideoUpload ? toCloudinaryFrame(sourceUrl, body.frameSecond ?? 0, 1024) : sourceUrl;
    const model = body.tier === "pro" ? MODELS.I2V_PRO : MODELS.I2V_STD;
    console.log(`[start-gen] I2V generation:`, {
      sourceUrl: sourceUrl.substring(0, 60) + "...",
      isVideoUpload,
      imageUrl: imageUrl.substring(0, 60) + "...",
      model,
      frameSecond: body.frameSecond ?? 0
    });
    const payload = {
      model,
      // I2V model only
      image_url: imageUrl,
      // Always image_url (even for video frames)
      prompt: body.prompt || "Animate this image with cinematic motion",
      fps: Math.min(60, Math.max(1, body.fps || 24)),
      duration: Math.min(10, Math.max(1, body.duration || 3)),
      stabilization: !!body.stabilization,
      // Optional: effect/style if vendor supports named effects
      ...body.effect ? { effect: body.effect } : {}
    };
    console.log(`[start-gen] Clean I2V payload:`, {
      model: payload.model,
      keys: Object.keys(payload),
      isVideoUpload,
      frameExtracted: isVideoUpload
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
      console.error(`[start-gen] Vendor I2V failed (${res.status}):`, text);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "vendor_start_failed",
          status: res.status,
          vendor: tryJson(text),
          sentKeys: Object.keys(payload),
          model,
          wasVideoUpload: isVideoUpload
        })
      };
    }
    const data = tryJson(text);
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
    console.log(`[start-gen] I2V Success:`, { job_id, model, isVideoUpload });
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job_id,
        model,
        vendor: "kling-v1.6-i2v",
        debug: {
          isVideoUpload,
          frameExtracted: isVideoUpload,
          model_used: model
        }
      })
    };
  } catch (err) {
    console.error("[start-gen] Exception:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "start-gen crashed",
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
//# sourceMappingURL=start-gen.js.map
