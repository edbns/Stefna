"use strict";
const { neon } = require('@neondatabase/serverless');
const { requireJWTUser, resp, handleCORS } = require('./_auth');
const sql = neon(process.env.NETLIFY_DATABASE_URL);
exports.handler = async (event) => {
    // Handle CORS preflight
    const corsResponse = handleCORS(event);
    if (corsResponse)
        return corsResponse;
    if (event.httpMethod !== "GET") {
        return resp(405, { error: 'Method not allowed' });
    }
    try {
        const user = requireJWTUser(event);
        if (!user) {
            return resp(401, { error: 'Unauthorized' });
        }
        console.log(`✅ list-assets: Auth OK for user: ${user.userId}`);
        const url = new URL(event.rawUrl);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 100);
        // Query media_assets table (the actual table, not compatibility view)
        const data = await sql `
      SELECT 
        id, url, resource_type, created_at, public_id, width, height, 
        meta, visibility, allow_remix, owner_id
      FROM media_assets 
      WHERE owner_id = ${user.userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
        return resp(200, {
            ok: true,
            items: data,
            count: data.length
        });
    }
    catch (err) {
        console.error("list-assets error:", err);
        return resp(500, { error: 'Internal server error' });
    }
};
