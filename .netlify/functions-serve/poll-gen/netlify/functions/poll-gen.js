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

// netlify/functions/poll-gen.ts
var poll_gen_exports = {};
__export(poll_gen_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(poll_gen_exports);
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
    const qs = event.queryStringParameters || {};
    const { id, model, persist, prompt } = qs;
    if (!id || !model) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing id or model",
          expected: "?id=<jobId>&model=<model>&persist=true",
          received: { id: !!id, model: !!model, keys: Object.keys(qs) }
        })
      };
    }
    console.log(`[poll-gen] I2V Polling:`, {
      job_id: id,
      model: model.substring(0, 50) + "...",
      persist: persist === "true"
    });
    const url = `${AIML_API_URL}/v2/generate/video/kling/generation?generation_id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[poll-gen] Vendor I2V poll failed (${res.status}):`, text);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Vendor poll failed",
          status: res.status,
          details: tryJson(text),
          job_id: id,
          model
        })
      };
    }
    const data = tryJson(text);
    const status = String(
      data.status || data.state || (data.video_url || data.content?.url ? "completed" : "")
    ).toLowerCase();
    console.log(`[poll-gen] I2V Status: ${status} for job ${id}`);
    if (status === "failed" || status === "error") {
      const error = data.error || data.message || text || "Unknown error";
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: false,
          status: "failed",
          job_id: id,
          error,
          model
        })
      };
    }
    if (status !== "completed") {
      const progress = data.progress ?? data.percent ?? data.meta?.progress;
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          status: "processing",
          job_id: id,
          progress,
          model
        })
      };
    }
    const resultUrl = data.video_url || data.content?.url || data.url;
    if (!resultUrl) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: false,
          status: "failed",
          job_id: id,
          error: "No resultUrl in vendor response",
          model,
          vendor_response: data
        })
      };
    }
    if (persist !== "true") {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          status: "completed",
          job_id: id,
          data: { mediaType: "video", resultUrl, publicId: null },
          model
        })
      };
    }
    const uploadPayload = {
      url: resultUrl,
      resource_type: "video",
      tags: ["aiml", "kling", "i2v", id],
      visibility: "public",
      prompt: prompt || "AI Generated Video from Image"
    };
    console.log(`[poll-gen] Persisting I2V result to Cloudinary:`, {
      resultUrl: resultUrl.substring(0, 60) + "...",
      model: model.substring(0, 40) + "...",
      job_id: id
    });
    const uploadRes = await fetch(`${event.headers.origin}/.netlify/functions/save-media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploadPayload)
    });
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error(`[poll-gen] save-media failed (${uploadRes.status}):`, errorText);
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          status: "completed",
          job_id: id,
          data: {
            mediaType: "video",
            resultUrl,
            publicId: null,
            note: "cloudinary-upload-failed"
          },
          model
        })
      };
    }
    const uploadData = await uploadRes.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        status: "completed",
        job_id: id,
        data: { mediaType: "video", resultUrl, publicId: uploadData.public_id },
        model
      })
    };
  } catch (err) {
    console.error("[poll-gen] Exception:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        status: "failed",
        error: "poll-gen crashed",
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
//# sourceMappingURL=poll-gen.js.map
