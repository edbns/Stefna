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
    console.log(`✅ purge-user: Auth OK for user: ${userId}`);

    console.log(`🗑️ Purging all assets for user: ${userId}`);

    // List all public_ids for logging
    const { data: items, error } = await supabase
      .from("assets").select("public_id, resource_type, folder")
      .eq("user_id", userId);
    if (error) throw error;

    console.log(`Found ${items?.length || 0} assets to delete`);

    // Cloudinary bulk delete by prefix (fastest), then DB rows
    const userFolder = `users/${userId}`;
    
    try {
      await cloudinary.api.delete_resources_by_prefix(userFolder, { resource_type: "image" });
      console.log(`✅ Deleted all images in folder: ${userFolder}`);
    } catch (err) {
      console.warn(`⚠️ Image deletion warning:`, err.message);
    }
    
    try {
      await cloudinary.api.delete_resources_by_prefix(userFolder, { resource_type: "video" });
      console.log(`✅ Deleted all videos in folder: ${userFolder}`);
    } catch (err) {
      console.warn(`⚠️ Video deletion warning:`, err.message);
    }
    
    // Optional: try to remove the empty folder
    try { 
      await cloudinary.api.delete_folder(userFolder); 
      console.log(`✅ Deleted folder: ${userFolder}`);
    } catch (err) {
      console.warn(`⚠️ Folder deletion warning:`, err.message);
    }

    // Delete all DB rows for this user
    const { error: delErr } = await supabase.from("assets").delete().eq("user_id", userId);
    if (delErr) throw delErr;

    console.log(`✅ Deleted all DB records for user: ${userId}`);

    return { statusCode: 200, body: JSON.stringify({ 
      ok: true, 
      deleted_assets: items?.length || 0,
      message: `Purged ${items?.length || 0} assets for user ${userId}`
    }) };
  } catch (err) {
    console.error("purge-user error:", err);
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
  }
};
