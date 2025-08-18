import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const jwtSecret = process.env.JWT_SECRET;
// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL);
// Helper function to create response
function resp(status, body) {
    return {
        statusCode: status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    };
}
export const handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return resp(200, { ok: true });
    }
    if (event.httpMethod !== 'POST') {
        return resp(405, { error: 'Method not allowed' });
    }
    try {
        // Use custom JWT authentication (not Netlify Identity)
        const auth = event.headers.authorization || "";
        const token = auth.replace(/^Bearer\s+/i, "");
        if (!token) {
            return resp(401, { error: 'Unauthorized - No bearer token provided' });
        }
        // Verify JWT token
        let claims;
        try {
            claims = jwt.verify(token, jwtSecret, { clockTolerance: 5 });
        }
        catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return resp(401, { error: 'Unauthorized - Invalid token' });
        }
        // Extract user ID from claims
        const uid = claims.sub || claims.user_id || claims.uid || claims.id || claims.userId;
        if (!uid) {
            return resp(401, { error: 'Unauthorized - No user ID in token' });
        }
        const email = claims.email || `user-${uid}@placeholder.com`;
        console.log('🔐 Auth context:', { uid, email, claims });
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        console.log('📝 Update profile request:', { uid, body });
        // FIRST: Ensure user exists in users table by upserting
        // This prevents the "User ID not found in users table" error
        try {
            await sql `
        INSERT INTO users (id, email, external_id, name, tier, created_at, updated_at)
        VALUES (${uid}, ${email || `user-${uid}@placeholder.com`}, ${email || `user-${uid}@placeholder.com`}, ${body.username || `User ${uid}`}, 'registered', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          external_id = EXCLUDED.external_id,
          name = EXCLUDED.name,
          updated_at = NOW()
      `;
            console.log('✅ User upserted successfully');
        }
        catch (userUpsertError) {
            console.error('Failed to upsert user in users table:', userUpsertError);
            return resp(500, {
                error: 'Failed to create/update user record',
                details: String(userUpsertError)
            });
        }
        // SECOND: Update user settings
        try {
            await sql `
        INSERT INTO user_settings (id, user_id, share_to_feed, allow_remix, updated_at)
        VALUES (${crypto.randomUUID()}, ${uid}, ${body.share_to_feed ?? true}, ${body.allow_remix ?? true}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          share_to_feed = ${body.share_to_feed ?? true},
          allow_remix = ${body.allow_remix ?? true},
          updated_at = NOW()
      `;
            console.log('✅ User settings upserted successfully');
        }
        catch (settingsUpsertError) {
            console.error('Failed to upsert user settings:', settingsUpsertError);
            // Don't fail the request for settings upsert errors
        }
        // Return success response
        return resp(200, {
            ok: true,
            message: 'Profile updated successfully',
            user: {
                id: uid,
                email,
                username: body.username || `User ${uid}`,
                tier: 'registered'
            }
        });
    }
    catch (error) {
        console.error('Handler error:', error);
        return resp(500, {
            error: 'Internal server error',
            details: String(error)
        });
    }
};
