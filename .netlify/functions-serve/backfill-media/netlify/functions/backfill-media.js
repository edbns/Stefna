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

// netlify/functions/backfill-media.ts
var backfill_media_exports = {};
__export(backfill_media_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(backfill_media_exports);
var import_supabase_js = require("@supabase/supabase-js");
var import_cloudinary = require("cloudinary");
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var MEGA_TAG = process.env.MEGA_COLLECTION_TAG ?? "collection:mega";
import_cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
var supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
function chunk(arr, n = 100) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
var handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const body = JSON.parse(event.body || "{}");
    const { userId, dryRun = false, includeFolders = [], includeTags = [] } = body;
    if (!userId) return { statusCode: 400, body: JSON.stringify({ ok: false, error: "userId required" }) };
    const expressions = [
      `folder="stefna/outputs/${userId}"`,
      `tags="user:${userId}"`,
      ...includeFolders.map((f) => `folder="${f}"`),
      ...includeTags.map((t) => `tags="${t}"`)
    ];
    const expression = expressions.join(" OR ");
    let next_cursor = void 0;
    const resources = [];
    do {
      const res = await import_cloudinary.v2.search.expression(expression).with_field("tags").with_field("bytes").with_field("context").with_field("folder").max_results(100).next_cursor(next_cursor).execute();
      resources.push(...res.resources || []);
      next_cursor = res.next_cursor;
    } while (next_cursor);
    const { data: existingRows, error: exErr } = await supabase.from("assets").select("cloudinary_public_id").eq("user_id", userId);
    if (exErr) throw exErr;
    const existingSet = new Set((existingRows || []).map((r) => r.cloudinary_public_id).filter(Boolean));
    const rows = resources.filter((r) => !existingSet.has(r.public_id)).map((r) => ({
      user_id: userId,
      cloudinary_public_id: r.public_id,
      media_type: r.resource_type === "video" ? "video" : "image",
      status: "ready",
      is_public: Array.isArray(r.tags) ? r.tags.includes("public") : false,
      allow_remix: r.context?.custom?.allow_remix === "true" || false,
      published_at: Array.isArray(r.tags) && r.tags.includes("public") ? r.created_at : null,
      source_asset_id: null,
      preset_key: r.context?.custom?.preset_key || null,
      prompt: null,
      created_at: r.created_at,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    let inserted = 0;
    if (!dryRun && rows.length) {
      const { error: insErr } = await supabase.from("assets").insert(rows);
      if (insErr) throw insErr;
      inserted = rows.length;
    }
    let retagged = 0;
    if (!dryRun && resources.length) {
      const publicIds = resources.map((r) => r.public_id);
      const batches = chunk(publicIds, 80);
      for (const ids of batches) {
        await import_cloudinary.v2.uploader.add_tag(`user:${userId}`, ids);
        await import_cloudinary.v2.uploader.add_tag(MEGA_TAG, ids);
        retagged += ids.length;
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        userId,
        foundInCloudinary: resources.length,
        inserted,
        retagged,
        dryRun,
        expression
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message, stack: err.stack }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=backfill-media.js.map
