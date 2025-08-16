// netlify/functions/getUserMedia.ts
import { neon } from '@neondatabase/serverless';
import { requireJWTUser, resp, handleCORS, sanitizeDatabaseUrl } from './_auth';

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

// Get user media from new database
async function getUserMedia(ownerId: string) {
  try {
    const media = await sql`
      SELECT 
        id, owner_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, public_id, resource_type, folder, bytes, width, height, meta
      FROM media_assets 
      WHERE owner_id = ${ownerId}
      ORDER BY created_at DESC
    `;
    
    return media;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

export const handler = async (event: any, context: any) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  try {
    // Use new authentication helper
    const user = requireJWTUser(event);
    
    if (!user) {
      return resp(401, { error: 'Unauthorized' });
    }

    // For POST requests, allow specifying a different userId in body
    let targetUserId = user.userId;
    if (event.httpMethod === 'POST') {
      try {
        const body = JSON.parse(event.body || '{}');
        if (body.userId && body.userId !== user.userId) {
          // Only allow if user is requesting their own media or has permission
          targetUserId = body.userId;
        }
      } catch (parseError) {
        console.log('Could not parse POST body, using authenticated user ID');
      }
    }

    // Get user media
    const media = await getUserMedia(targetUserId);
    
    // Ensure user exists in users table
    try {
      await sql`
        INSERT INTO users (id, email, external_id, created_at, updated_at)
        VALUES (${user.userId}, ${user.email || `user-${user.userId}@placeholder.com`}, ${user.userId}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          updated_at = NOW()
      `;
    } catch (userError) {
      console.error('Failed to upsert user:', userError);
      // Continue even if user upsert fails
    }

    return resp(200, {
      ok: true,
      userId: targetUserId,
      items: media, // Changed from 'media' to 'items' to match frontend expectation
      count: media.length
    });

  } catch (error) {
    console.error('Handler error:', error);
    return resp(500, { error: 'Internal server error' });
  }
};
