const { createClient } = require("@supabase/supabase-js");
const { v2: cloudinary } = require("cloudinary");
const { verifyAuth } = require("./_auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { userId } = verifyAuth(event);
    console.log(`✅ delete-asset: Auth OK for user: ${userId}`);

    const { id } = JSON.parse(event.body || "{}");
    if (!id) return { statusCode: 400, body: JSON.stringify({ message: "Missing id" }) };

    // Fetch asset and verify ownership
    const { data: asset, error } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !asset || asset.user_id !== userId) {
      return { statusCode: 404, body: JSON.stringify({ message: "Not found" }) };
    }

    // Delete from Cloudinary
    const isVideo = asset.resource_type === "video";
    await cloudinary.uploader.destroy(asset.public_id, {
      resource_type: isVideo ? "video" : "image",
      invalidate: true
    });

    // Delete DB row
    const { error: delErr } = await supabase.from("assets").delete().eq("id", id);
    if (delErr) throw delErr;

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("delete-asset error:", err);
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }
};
