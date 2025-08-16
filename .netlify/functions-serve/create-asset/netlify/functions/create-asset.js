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

// netlify/functions/create-asset.ts
var create_asset_exports = {};
__export(create_asset_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(create_asset_exports);

// netlify/lib/supabaseAdmin.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseAdmin = (0, import_supabase_js.createClient)(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// netlify/functions/create-asset.ts
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
var handler = async (event) => {
  if (process.env.NO_DB_MODE === "true") {
    const fakeId = "cld-" + (globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36));
    return { statusCode: 200, body: JSON.stringify({ ok: true, data: { id: fakeId } }) };
  }
  try {
    const input = JSON.parse(event.body || "{}");
    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) return resp({ ok: false, error: "Unauthorized" });
    const mediaType = input.mediaType === "video" || input.mediaType === "image" ? input.mediaType : "image";
    const { data, error } = await supabaseAdmin.from("assets").insert({
      user_id: userId,
      cloudinary_public_id: input.sourcePublicId ?? null,
      media_type: mediaType,
      // compatibility with legacy schemas that still require resource_type
      resource_type: mediaType,
      preset_key: input.presetKey ?? null,
      prompt: input.prompt ?? null,
      source_asset_id: input.sourceAssetId ?? null,
      status: "queued",
      is_public: false,
      allow_remix: false
    }).select("*").single();
    if (error) return resp({ ok: false, error: error.message });
    return resp({ ok: true, data });
  } catch (e) {
    return resp({ ok: false, error: e.message || "create-asset error" });
  }
};
function resp(body) {
  return { statusCode: body.ok ? 200 : 400, body: JSON.stringify(body) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=create-asset.js.map
