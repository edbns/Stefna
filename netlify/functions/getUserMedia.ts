// netlify/functions/getUserMedia.ts
import { neon } from '@neondatabase/serverless';
import { requireUser, resp, handleCORS } from './_auth';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!)

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

  if (event.httpMethod !== 'GET') {
    return resp(405, { error: 'Method not allowed' });
  }

  try {
    // Use new authentication helper
    const user = requireUser(context);
    
    if (!user) {
      return resp(401, { error: 'Unauthorized' });
    }

    // Get user media
    const media = await getUserMedia(user.id);
    
    // Ensure user exists in users table
    try {
      await sql`
        INSERT INTO users (id, email, external_id, created_at, updated_at)
        VALUES (${user.id}, ${user.email || `user-${user.id}@placeholder.com`}, ${user.id}, NOW(), NOW())
        ON CONFLICT (external_id) DO UPDATE SET 
          email = EXCLUDED.email,
          updated_at = NOW()
      `;
    } catch (userError) {
      console.error('Failed to upsert user:', userError);
      // Continue even if user upsert fails
    }

    return resp(200, {
      ok: true,
      userId: user.id,
      media,
      count: media.length
    });

  } catch (error) {
    console.error('Handler error:', error);
    return resp(500, { error: 'Internal server error' });
  }
};
