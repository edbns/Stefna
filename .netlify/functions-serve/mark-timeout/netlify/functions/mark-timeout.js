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

// netlify/functions/mark-timeout.ts
var mark_timeout_exports = {};
__export(mark_timeout_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(mark_timeout_exports);
var import_supabase_js = require("@supabase/supabase-js");
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const id = body?.id;
    const reason = body?.reason || "client finalized after watchdog";
    if (!id) {
      return { statusCode: 400, body: "missing id" };
    }
    const supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from("ai_generations").update({ status: "timeout", error: reason }).eq("id", id).in("status", ["queued", "processing"]);
    if (error) {
      return { statusCode: 500, body: `db error: ${error.message}` };
    }
    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 400, body: e?.message || "bad request" };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=mark-timeout.js.map
