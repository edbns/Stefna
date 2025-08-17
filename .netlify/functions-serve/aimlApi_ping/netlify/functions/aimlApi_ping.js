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

// netlify/functions/aimlApi_ping.ts
var aimlApi_ping_exports = {};
__export(aimlApi_ping_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(aimlApi_ping_exports);
var handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        have: {
          AIML_API_KEY: !!process.env.AIML_API_KEY,
          DATABASE_URL: !!process.env.DATABASE_URL,
          NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
          AUTH_JWT_SECRET: !!process.env.AUTH_JWT_SECRET,
          NODE_VERSION: process.version
        },
        bodyKeys: body ? Object.keys(body) : []
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=aimlApi_ping.js.map
