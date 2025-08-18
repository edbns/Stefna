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
    if (event.httpMethod !== 'PUT') {
        return resp(405, { error: 'Method Not Allowed' });
    }
    try {
        // Use new authentication helper
        const user = requireJWTUser(event);
        if (!user) {
            return resp(401, { error: 'Authentication required' });
        }
        const { name, avatar } = JSON.parse(event.body || '{}');
        if (!name && !avatar) {
            return resp(400, { error: 'Name or avatar required' });
        }
        console.log(`📝 Updating user ${user.userId}:`, { name, avatar });
        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (name) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (avatar) {
            updates.push(`avatar_url = $${paramIndex++}`);
            values.push(avatar);
        }
        // Add updated_at
        updates.push(`updated_at = NOW()`);
        const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, avatar_url, updated_at
    `;
        values.push(user.userId);
        const result = await sql.query(updateQuery, values);
        if (result.rows.length === 0) {
            console.error('❌ User not found for update:', user.userId);
            return resp(404, { error: 'User not found' });
        }
        const updated = result.rows[0];
        console.log(`✅ User updated successfully:`, updated);
        return resp(200, {
            success: true,
            user: updated
        });
    }
    catch (error) {
        console.error('❌ Update user error:', error);
        return resp(500, { error: error?.message || 'Internal server error' });
    }
};
