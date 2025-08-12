const { v2: cloudinary } = require("cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Check Cloudinary environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary env missing:', { 
        hasCloudName: !!cloudName, 
        hasKey: !!apiKey, 
        hasSecret: !!apiSecret 
      });
      return { 
        statusCode: 500, 
        body: `sign_failed: Cloudinary environment not configured` 
      };
    }

    // Always sign only what you'll send from the client
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'users'; // optional, if you actually use it

    const paramsToSign = { timestamp, folder }; // keep minimal & consistent
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
      }),
    };
  } catch (e) {
    console.error("cloudinary-sign error:", e);
    // Return TEXT on error so the client can parse gracefully
    return { 
      statusCode: 500, 
      body: `sign_failed: ${e?.message ?? 'unknown'}` 
    };
  }
};
