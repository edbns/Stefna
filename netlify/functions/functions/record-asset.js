"use strict";
const { neon } = require('@neondatabase/serverless');
const { requireJWTUser, resp, handleCORS } = require('./_auth');
const sql = neon(process.env.NETLIFY_DATABASE_URL);
exports.handler = async (event) => {
    // Handle CORS preflight
    const corsResponse = handleCORS(event);
    if (corsResponse)
        return corsResponse;
    if (event.httpMethod !== "POST") {
        return resp(405, { error: 'Method not allowed' });
    }
    try {
        const user = requireJWTUser(event);
        if (!user) {
            return resp(401, { error: 'Unauthorized' });
        }
        console.log(`✅ record-asset: Auth OK for user: ${user.userId}`);
        const body = JSON.parse(event.body || "{}");
        // Normalize resource_type (accept photo/image, video)
        let resource_type = body.resource_type || body.type || "image";
        if (resource_type === "photo")
            resource_type = "image";
        if (!["image", "video"].includes(resource_type)) {
            return resp(400, {
                error: `resource_type must be "image" or "video", got "${resource_type}"`
            });
        }
        const { url, public_id, folder, bytes, width, height, duration, meta } = body;
        if (!url) {
            return resp(400, { error: "Missing required field: url" });
        }
        // Insert with normalized resource_type, make optional fields truly optional
        try {
            const result = await sql `
        INSERT INTO media_assets (
          id, owner_id, url, public_id, resource_type, folder,
          bytes, width, height, meta, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${user.userId}, ${url}, 
          ${public_id || null}, ${resource_type}, ${folder || null},
          ${bytes || null}, ${width || null}, ${height || null}, 
          ${meta || null}, NOW(), NOW()
        )
        RETURNING id
      `;
            const assetId = result[0]?.id;
            console.log(`✅ Asset recorded: ${assetId} for user ${user.userId}`);
            return resp(200, {
                ok: true,
                id: assetId,
                message: "Asset saved successfully"
            });
        }
        catch (dbError) {
            console.error("Database insert error:", dbError);
            return resp(400, {
                error: `Database error: ${dbError.message}`,
                details: process.env.NODE_ENV === 'development' ? dbError.toString() : undefined
            });
        }
    }
    catch (err) {
        console.error("record-asset error:", err);
        // Return specific error messages based on error type
        if (err.message?.includes("Unauthorized") || err.message?.includes("no_bearer")) {
            return resp(401, { error: "Authentication required" });
        }
        return resp(500, {
            error: err.message || "Internal server error",
            details: process.env.NODE_ENV === 'development' ? err.toString() : undefined
        });
    }
};
