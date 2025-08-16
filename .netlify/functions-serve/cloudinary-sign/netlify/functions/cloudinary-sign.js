"use strict";

// netlify/functions/cloudinary-sign.js
var { v2: cloudinary } = require("cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      console.error("\u274C Cloudinary env missing:", {
        hasCloudName: !!cloudName,
        hasKey: !!apiKey,
        hasSecret: !!apiSecret
      });
      return {
        statusCode: 500,
        body: `sign_failed: Cloudinary environment not configured`
      };
    }
    const timestamp = Math.floor(Date.now() / 1e3);
    const folder = "users";
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
        // snake_case variants for existing client helpers
        cloud_name: cloudName,
        api_key: apiKey
      })
    };
  } catch (e) {
    console.error("cloudinary-sign error:", e);
    return {
      statusCode: 500,
      body: `sign_failed: ${e?.message ?? "unknown"}`
    };
  }
};
//# sourceMappingURL=cloudinary-sign.js.map
