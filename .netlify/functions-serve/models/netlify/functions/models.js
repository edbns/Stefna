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

// netlify/functions/models.ts
var models_exports = {};
__export(models_exports, {
  MODELS: () => MODELS,
  detectIsVideo: () => detectIsVideo,
  isVideoAsset: () => isVideoAsset,
  toCloudinaryFrame: () => toCloudinaryFrame
});
module.exports = __toCommonJS(models_exports);
var MODELS = {
  I2V_STD: "kling-video/v1.6/standard/image-to-video",
  I2V_PRO: "kling-video/v1.6/pro/image-to-video"
};
function detectIsVideo(url) {
  return !!url && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}
function isVideoAsset(asset) {
  return asset?.resource_type === "video" || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(asset?.secure_url || asset?.url || "");
}
function toCloudinaryFrame(url, second = 0, width = 1024) {
  if (!url?.includes("res.cloudinary.com")) return url;
  return url.replace("/video/upload/", `/video/upload/so_${second},w_${width},f_jpg,q_auto/`).replace(/\.(mp4|mov|m4v|webm)(\?|$)/i, ".jpg$2");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MODELS,
  detectIsVideo,
  isVideoAsset,
  toCloudinaryFrame
});
//# sourceMappingURL=models.js.map
