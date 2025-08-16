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

// netlify/functions/getUserMedia.ts
var getUserMedia_exports = {};
__export(getUserMedia_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getUserMedia_exports);
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
    const err2 = new Error(msg);
    err2.code = "ENV_MISSING";
    throw err2;
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

// netlify/functions/getUserMedia.ts
var ok = (b) => ({ statusCode: 200, body: JSON.stringify(b) });
var err = (s, m) => ({ statusCode: s, body: JSON.stringify({ error: m }) });
function base64urlToJson(b64url) {
  const raw = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = raw.length % 4 ? raw + "=".repeat(4 - raw.length % 4) : raw;
  return JSON.parse(Buffer.from(pad, "base64").toString("utf8"));
}
function getJwt(event) {
  const h = event.headers?.authorization || event.headers?.Authorization;
  const m = h && String(h).match(/^Bearer\s+(.+)/i);
  return m ? m[1] : null;
}
function decodeClaims(jwt) {
  if (!jwt) return null;
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    return base64urlToJson(parts[1]) || null;
  } catch {
    return null;
  }
}
function pickUuidClaim(claims) {
  for (const k of ["sub", "uid", "user_id", "userId", "id"]) {
    const v = claims?.[k];
    if (/^[0-9a-f-]{36}$/i.test(v)) return String(v);
  }
  return null;
}
async function resolveUserFromJWT(event, supabase) {
  const jwt = getJwt(event);
  if (!jwt) return { userId: null, identityId: null, email: null };
  const claims = decodeClaims(jwt) || {};
  const userId = pickUuidClaim(claims);
  const email = claims.email || claims.mail || null;
  let identityId = null;
  if (userId) {
    try {
      const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).single();
      identityId = profile?.id || null;
    } catch (e) {
      console.log("No profile found for userId:", userId);
    }
  }
  return { userId, identityId, email };
}
async function findMediaWithFallback(supabase, primaryUserId, identityId, email) {
  let items = [];
  if (primaryUserId) {
    const { data, error } = await supabase.from("media_assets").select(`
        id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, result_url, meta
      `).eq("user_id", primaryUserId).order("created_at", { ascending: false });
    if (!error && data) {
      items = data;
      console.log(`\u2705 Found ${items.length} media items for primary userId: ${primaryUserId}`);
    }
  }
  if (items.length === 0 && identityId && identityId !== primaryUserId) {
    const { data, error } = await supabase.from("media_assets").select(`
        id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, result_url, meta
      `).eq("user_id", identityId).order("created_at", { ascending: false });
    if (!error && data) {
      items = data;
      console.log(`\u2705 Found ${items.length} media items for identityId: ${identityId}`);
      console.log(`\u{1F504} Legacy media found under identityId ${identityId}, consider migrating to userId ${primaryUserId}`);
    }
  }
  if (items.length === 0 && email) {
    try {
      const { data, error } = await supabase.from("media_assets").select(`
          id, user_id, visibility, allow_remix, created_at, env, prompt, model, mode,
          url, result_url, meta
        `).eq("meta->>email", email).order("created_at", { ascending: false });
      if (!error && data) {
        items = data;
        console.log(`\u2705 Found ${items.length} media items for email: ${email}`);
        console.log(`\u{1F504} Very legacy media found under email ${email}, consider migrating to userId ${primaryUserId}`);
      }
    } catch (e) {
      console.log("Email-based lookup not supported or failed:", e);
    }
  }
  return items;
}
var handler = async (event) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { userId, identityId, email } = await resolveUserFromJWT(event, supabase);
      if (!userId) return ok({ items: [] });
      const items = await findMediaWithFallback(supabase, userId, identityId, email);
      console.log(`\u2705 Database query returned ${items.length} items for user ${userId}`);
      return ok({ items });
    } catch (e) {
      console.error("[getUserMedia] Database query error:", e);
    }
  }
  if (process.env.NO_DB_MODE === "true") {
    try {
      const cloudinary2 = initCloudinary();
      const qpUserId = event.queryStringParameters?.userId || "";
      let userId = qpUserId;
      if (!userId) {
        const jwt = getJwt(event);
        const claims = decodeClaims(jwt) || {};
        userId = pickUuidClaim(claims) || "";
      }
      if (!userId) return ok({ ok: true, items: [] });
      const exprUserTag = `tags="stefna" AND tags="type:output" AND tags="user:${userId}"`;
      const exprContext = `tags="stefna" AND tags="type:output" AND context.user_id="${userId}"`;
      const expr = `(${exprUserTag}) OR (${exprContext})`;
      const res = await cloudinary2.search.expression(expr).sort_by("created_at", "desc").max_results(100).execute();
      const items = (res?.resources || []).map((r) => ({
        id: r.public_id,
        user_id: r.context?.custom?.user_id || userId,
        resource_type: r.resource_type,
        url: r.resource_type === "video" ? r.secure_url : r.secure_url,
        result_url: r.secure_url,
        created_at: r.created_at,
        visibility: (r.tags || []).includes("public") ? "public" : "private",
        allow_remix: r.context?.custom?.allow_remix === "true",
        prompt: r.context?.custom?.prompt || null,
        mode: r.context?.custom?.mode_meta ? JSON.parse(r.context?.custom?.mode_meta) : null,
        meta: r.context?.custom || {}
      }));
      return ok({ ok: true, items });
    } catch (e) {
      console.error("[getUserMedia] error", e);
      return err(500, e?.message || "Internal server error");
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=getUserMedia.js.map
