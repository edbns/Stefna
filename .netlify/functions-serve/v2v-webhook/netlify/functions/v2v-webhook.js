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

// netlify/functions/v2v-webhook.ts
var v2v_webhook_exports = {};
__export(v2v_webhook_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(v2v_webhook_exports);
var import_supabase_js = require("@supabase/supabase-js");
var supabase = (0, import_supabase_js.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
var SHARED_SECRET = process.env.V2V_WEBHOOK_SECRET || "";
var handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const secret = event.headers["x-webhook-secret"] || event.headers["x-signature"];
    if (SHARED_SECRET && secret !== SHARED_SECRET) return { statusCode: 401, body: "unauthorized" };
    const body = JSON.parse(event.body || "{}");
    const { jobId, state, outputUrl, error, progress } = body;
    if (!jobId) return { statusCode: 400, body: "jobId required" };
    const update = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    if (typeof progress === "number") update.progress = Math.max(0, Math.min(100, progress));
    if (state === "completed") {
      update.status = "completed";
      update.output_url = outputUrl;
      update.progress = 100;
    } else if (state === "failed") {
      update.status = "failed";
      update.error = error || "unknown error";
    } else if (state === "processing" || state === "queued") {
      update.status = "processing";
    }
    const { error: uerr } = await supabase.from("ai_generations").update(update).eq("id", jobId);
    if (uerr) return { statusCode: 400, body: JSON.stringify({ error: uerr.message }) };
    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.error("v2v-webhook error", e);
    return { statusCode: 400, body: "bad payload" };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=v2v-webhook.js.map
