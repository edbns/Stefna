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

    const { userId } = verifyAuth(event);
    console.log(`✅ cloudinary-sign: Auth OK for user: ${userId}`);

    const { resource_type = "image", public_id } = JSON.parse(event.body || "{}");

    const folder = `users/${userId}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = { timestamp, folder };
    if (public_id) paramsToSign.public_id = public_id;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        signature,
        timestamp,
        folder,
        resource_type,
      }),
    };
  } catch (err) {
    console.error("cloudinary-sign error:", err.message);
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }
};
