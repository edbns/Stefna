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

// netlify/functions/getPublicFeed.ts
var getPublicFeed_exports = {};
__export(getPublicFeed_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getPublicFeed_exports);
var import_supabase_js = require("@supabase/supabase-js");

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

// netlify/functions/getPublicFeed.ts
var supabase = (0, import_supabase_js.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
var handler = async (event) => {
  if (process.env.NO_DB_MODE !== "true") {
    return { statusCode: 412, body: JSON.stringify({ ok: false, error: "NO_DB_MODE=false (DB mode disabled here)" }) };
  }
  try {
    assertCloudinaryEnv();
    const cloudinary2 = initCloudinary();
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const res = await cloudinary2.search.expression('(tags="stefna" AND tags="type:output" AND tags="public") AND (resource_type:image OR resource_type:video)').sort_by("created_at", "desc").max_results(limit).execute();
    const data = (res?.resources || []).map((r) => ({
      id: r.public_id,
      cloudinary_public_id: r.public_id,
      media_type: r.resource_type === "video" ? "video" : "image",
      published_at: r.created_at,
      preset_key: r.context?.custom?.preset_key || null,
      source_public_id: r.context?.custom?.source_public_id || null,
      user_id: r.context?.custom?.user_id || r.context?.user_id || null,
      user_avatar: null,
      // Not stored in Cloudinary context
      user_tier: null,
      // Not stored in Cloudinary context
      prompt: r.context?.custom?.prompt || null
      // Extract prompt from Cloudinary context
    }));
    return { statusCode: 200, body: JSON.stringify({ ok: true, source: "cloudinary", data }) };
  } catch (e) {
    const msg = e?.message || e?.error?.message || e?.error || "unknown error";
    const code = e?.code || "UNKNOWN";
    console.error("[getPublicFeed] error", { code, msg, raw: e });
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: `${code}: ${msg}` }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=getPublicFeed.js.map
