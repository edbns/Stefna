const { v2: cloudinary } = require("cloudinary");
const { verifyAuth } = require("./_auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    // Check Cloudinary environment variables first
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    console.log('🔍 Cloudinary env check:', { 
      hasCloudName: !!cloudName, 
      hasKey: !!apiKey, 
      hasSecret: !!apiSecret,
      cloudName: cloudName ? `${cloudName.substring(0, 3)}...` : 'missing',
      apiKey: apiKey ? `${apiKey.substring(0, 3)}...` : 'missing'
    });
    
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary env missing', { 
        hasCloudName: !!cloudName, 
        hasKey: !!apiKey, 
        hasSecret: !!apiSecret 
      });
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Cloudinary env not configured' }) 
      };
    }

    // Temporarily disable auth requirement for testing
    let userId = 'test-user';
    try {
      const authResult = verifyAuth(event);
      userId = authResult.userId;
      console.log(`✅ cloudinary-sign: Auth OK for user: ${userId}`);
    } catch (authError) {
      console.log(`⚠️ cloudinary-sign: Auth failed, using test user: ${authError.message}`);
      userId = 'test-user';
    }

    const { resource_type = "image", public_id } = JSON.parse(event.body || "{}");

    const folder = `users/${userId}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = { timestamp, folder };
    if (public_id) paramsToSign.public_id = public_id;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudName,
        apiKey,
        signature,
        timestamp,
        folder,
        resource_type,
      }),
    };
  } catch (err) {
    console.error("cloudinary-sign error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'sign_failed' }) };
  }
};
