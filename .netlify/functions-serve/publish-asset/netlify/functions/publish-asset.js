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

// netlify/functions/publish-asset.ts
var publish_asset_exports = {};
__export(publish_asset_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(publish_asset_exports);

// netlify/lib/neonAdmin.ts
var neonAdmin = {
  from: (table) => {
    console.warn(`neonAdmin.from('${table}') is deprecated. Use Neon sql directly instead.`);
    return {
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) })
    };
  }
};

// netlify/functions/publish-asset.ts
var handler = async (event) => {
  try {
    const input = JSON.parse(event.body || "{}");
    if (!input.assetId) return resp({ ok: false, error: "assetId required" });
    const { data, error } = await neonAdmin.from("assets").update({
      is_public: input.isPublic,
      allow_remix: input.allowRemix
    }).eq("id", input.assetId).select("*").single();
    if (error) return resp({ ok: false, error: error.message });
    return resp({ ok: true, data });
  } catch (e) {
    return resp({ ok: false, error: e.message || "publish-asset error" });
  }
};
function resp(body) {
  return { statusCode: body.ok ? 200 : 400, body: JSON.stringify(body) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=publish-asset.js.map
