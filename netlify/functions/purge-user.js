const { neon } = require("@neondatabase/serverless");
const { v2: cloudinary } = require("cloudinary");
const { requireJWTUser, resp, handleCORS, sanitizeDatabaseUrl } = require("./_auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    if (event.httpMethod !== "POST") {
      return resp(405, { error: "Method Not Allowed" });
    }

    // Use new authentication helper
    const user = requireJWTUser(event);
    
    if (!user) {
      return resp(401, { error: "Authentication required" });
    }

    console.log(`✅ purge-user: Auth OK for user: ${user.userId}`);

    console.log(`🗑️ Purging all assets for user: ${user.userId}`);

    // List all public_ids for logging
    const items = await sql`
      SELECT public_id, resource_type, folder
      FROM media_assets 
      WHERE owner_id = ${user.userId}
    `;

    console.log(`Found ${items?.length || 0} assets to delete`);

    // Cloudinary bulk delete by prefix (fastest), then DB rows
    const userFolder = `users/${user.userId}`;
    
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
    const deleteResult = await sql`
      DELETE FROM media_assets 
      WHERE owner_id = ${user.userId}
    `;

    console.log(`✅ Deleted all DB records for user: ${user.userId}`);

    return resp(200, { 
      ok: true, 
      deleted_assets: items?.length || 0,
      message: `Purged ${items?.length || 0} assets for user ${user.userId}`
    });

  } catch (err) {
    console.error("purge-user error:", err);
    return resp(500, { error: err.message || "Internal server error" });
  }
};
