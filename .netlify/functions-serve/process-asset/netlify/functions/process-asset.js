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

// netlify/functions/process-asset.ts
var process_asset_exports = {};
__export(process_asset_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(process_asset_exports);

// netlify/lib/supabaseAdmin.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseAdmin = (0, import_supabase_js.createClient)(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// netlify/lib/cloudinary.ts
var import_cloudinary = require("cloudinary");
import_cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// netlify/functions/process-asset.ts
async function runAIMLTransform(input) {
  return { finalBuffer: Buffer.from("fake-binary") };
}
var handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || "{}");
    if (!payload.assetId || !payload.sourcePublicId || !payload.mediaType) {
      return resp({ ok: false, error: "assetId, sourcePublicId, mediaType required" });
    }
    await supabaseAdmin.from("assets").update({ status: "processing" }).eq("id", payload.assetId);
    const result = await runAIMLTransform(payload);
    if (result.error) {
      await supabaseAdmin.from("assets").update({ status: "failed" }).eq("id", payload.assetId);
      return resp({ ok: false, error: result.error });
    }
    const uploadRes = await import_cloudinary.v2.uploader.upload_stream({ resource_type: payload.mediaType === "video" ? "video" : "image" }, async () => {
    });
    const finalPublicId = await new Promise((resolve, reject) => {
      const upload = import_cloudinary.v2.uploader.upload_stream(
        { resource_type: payload.mediaType === "video" ? "video" : "image" },
        (err, res) => {
          if (err || !res?.public_id) return reject(err || new Error("No Cloudinary response"));
          resolve(res.public_id);
        }
      );
      if (result.finalBuffer) {
        upload.end(result.finalBuffer);
      } else {
        reject(new Error("No AI output buffer"));
      }
    });
    console.log(`[process-asset] Updating asset ${payload.assetId} with:`, {
      status: "ready",
      cloudinary_public_id: finalPublicId,
      media_type: payload.mediaType
    });
    const { error: updErr } = await supabaseAdmin.from("assets").update({
      status: "ready",
      cloudinary_public_id: finalPublicId,
      media_type: payload.mediaType
      // Ensure media_type is set
    }).eq("id", payload.assetId);
    if (updErr) {
      console.error(`[process-asset] DB update failed:`, updErr);
      return resp({ ok: false, error: updErr.message });
    }
    console.log(`[process-asset] Asset ${payload.assetId} successfully updated to ready status`);
    return resp({ ok: true, data: { assetId: payload.assetId, finalPublicId } });
  } catch (e) {
    return resp({ ok: false, error: e.message || "process-asset error" });
  }
};
function resp(body) {
  return { statusCode: body.ok ? 200 : 400, body: JSON.stringify(body) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=process-asset.js.map
