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

// netlify/functions/_cloudinary.ts
var cloudinary_exports = {};
__export(cloudinary_exports, {
  assertCloudinaryEnv: () => assertCloudinaryEnv,
  initCloudinary: () => initCloudinary
});
module.exports = __toCommonJS(cloudinary_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assertCloudinaryEnv,
  initCloudinary
});
//# sourceMappingURL=_cloudinary.js.map
