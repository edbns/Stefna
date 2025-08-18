"use strict";
const { neon } = require('@neondatabase/serverless');
const { requireJWTUser, resp, handleCORS, sanitizeDatabaseUrl } = require('./_auth');
// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
    throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);
exports.handler = async (event) => {
    // Handle CORS preflight
    const corsResponse = handleCORS(event);
    if (corsResponse)
        return corsResponse;
    if (event.httpMethod !== 'POST') {
        return resp(405, { error: 'Method Not Allowed' });
    }
    try {
        // Use new authentication helper
        const user = requireJWTUser(event);
        if (!user) {
            return resp(401, { error: 'Authentication required' });
        }
        const body = JSON.parse(event.body || '{}');
        const { action, env = 'prod' } = body;
        if (action !== 'bulk-share') {
            return resp(400, { error: 'Invalid action' });
        }
        console.log(`🔄 Bulk share requested by user ${user.userId} for env: ${env}`);
        // Get count of user's media that could be shared
        const countResult = await sql `
      SELECT id, visibility, env
      FROM media_assets 
      WHERE owner_id = ${user.userId}
      AND (visibility != 'public' OR env != ${env})
    `;
        if (!countResult || countResult.length === 0) {
            return resp(200, {
                message: 'No media items to update',
                updated: 0
            });
        }
        console.log(`📊 Found ${countResult.length} items to update`);
        // Bulk update all user's media to public and correct env
        const updateResult = await sql `
      UPDATE media_assets 
      SET visibility = 'public', 
          env = ${env},
          updated_at = NOW()
      WHERE owner_id = ${user.userId}
      AND (visibility != 'public' OR env != ${env})
      RETURNING id, visibility, env, updated_at
    `;
        console.log(`✅ Successfully updated ${updateResult?.length || 0} media items`);
        return resp(200, {
            message: `Successfully made ${updateResult?.length || 0} items public`,
            updated: updateResult?.length || 0,
            items: updateResult
        });
    }
    catch (error) {
        console.error('❌ Bulk share error:', error);
        return resp(500, { error: error?.message || 'Internal server error' });
    }
};
