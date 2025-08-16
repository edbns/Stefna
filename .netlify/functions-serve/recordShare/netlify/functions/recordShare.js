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
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/recordShare.ts
var recordShare_exports = {};
__export(recordShare_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(recordShare_exports);

// netlify/functions/_cloudinary.ts
var import_cloudinary = require("cloudinary");
function assertCloudinaryEnv() {
  const missing = [
    ["CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME],
    ["CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY],
    ["CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET]
  ].filter(([k, v]) => !v).map(([k]) => k);
  if (missing.length) {
    const msg = `Missing Cloudinary env: ${missing.join(", ")}`;
    console.error("[cloudinary] " + msg);
    const err = new Error(msg);
    err.code = "ENV_MISSING";
    throw err;
  }
}
function initCloudinary() {
  assertCloudinaryEnv();
  import_cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  return import_cloudinary.v2;
}

// netlify/functions/recordShare.ts
var import_supabase_js = require("@supabase/supabase-js");
var url = process.env.SUPABASE_URL;
var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase = url && key ? (0, import_supabase_js.createClient)(url, key, { auth: { persistSession: false } }) : null;
function getUserIdFromToken(auth) {
  try {
    if (!auth?.startsWith("Bearer ")) return null;
    const jwt = auth.slice(7);
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
    const id = payload.sub || payload.uid || payload.user_id || payload.userId || payload.id;
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}
async function resolvePublicIdByAssetId(cloudinary2, assetId) {
  const expr = `tags="stefna" AND context.asset_id="${assetId}"`;
  const maxAttempts = 6;
  const delayMs = 300;
  for (let i = 0; i < maxAttempts; i++) {
    const found = await cloudinary2.search.expression(expr).max_results(1).execute();
    const pid = found?.resources?.[0]?.public_id;
    if (pid) return pid;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}
var handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: "Method not allowed" }) };
    }
    const body = JSON.parse(event.body || "{}");
    if (process.env.NO_DB_MODE === "true") {
      let publicId = body.publicId;
      const allowRemix2 = !!body.allowRemix;
      const assetId = body.assetId || body.asset_id;
      if (!publicId && !assetId) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: "MISSING: publicId (or assetId)" }) };
      }
      try {
        assertCloudinaryEnv();
        const cloudinary2 = initCloudinary();
        if (!publicId && assetId) {
          publicId = await resolvePublicIdByAssetId(cloudinary2, assetId);
          if (!publicId) {
            return { statusCode: 404, body: JSON.stringify({ ok: false, error: `No Cloudinary asset found for assetId ${assetId}` }) };
          }
        }
        await cloudinary2.api.add_tag("stefna", [publicId]);
        await cloudinary2.api.add_tag("type:output", [publicId]);
        await cloudinary2.api.add_tag("public", [publicId]);
        await cloudinary2.uploader.explicit(publicId, {
          type: "upload",
          context: { allow_remix: allowRemix2 ? "true" : "false", published_at: (/* @__PURE__ */ new Date()).toISOString() }
        });
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      } catch (e) {
        const msg = e?.message || "unknown error";
        console.error("[recordShare] cloudinary error", msg);
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: msg }) };
      }
    }
    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: "Unauthorized" }) };
    }
    const { asset_id, shareToFeed, allowRemix } = body;
    if (!asset_id) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "asset_id required" }) };
    }
    const is_public = !!shareToFeed;
    const allow_remix = !!shareToFeed && !!allowRemix;
    const { data, error } = await supabase.from("assets").update({ is_public, allow_remix }).eq("id", asset_id).eq("user_id", userId).select("id, is_public, allow_remix, published_at").single();
    if (error) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: error.message }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, asset: data }) };
  } catch (e) {
    const msg = e?.message || "unknown error";
    console.error("recordShare error:", msg);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: msg }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=recordShare.js.map
