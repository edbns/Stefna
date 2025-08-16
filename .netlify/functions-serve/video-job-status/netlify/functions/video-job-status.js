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

// netlify/functions/video-job-status.ts
var video_job_status_exports = {};
__export(video_job_status_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(video_job_status_exports);
var import_supabase_js = require("@supabase/supabase-js");
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
var handler = async (event) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method not allowed" };
  const job_id = (event.queryStringParameters || {}).job_id;
  if (!job_id) return { statusCode: 400, body: "job_id required" };
  const supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: event.headers.authorization || "" } }
  });
  const { data, error } = await supabase.from("video_jobs").select("id,status,result_url,error,provider_job_id,updated_at").eq("id", job_id).single();
  if (error) return { statusCode: 404, body: JSON.stringify({ error: error.message }) };
  return { statusCode: 200, body: JSON.stringify(data) };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=video-job-status.js.map
