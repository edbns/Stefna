// netlify/functions/getUserMedia.ts
import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';
import { getAuthedUser } from '../lib/auth';

// Helper function to validate UUID format
function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Get user media from new database
async function getUserMedia(ownerId: string) {
  try {
    const media = await sql`
      SELECT 
        id, user_id, is_public, allow_remix, created_at, prompt,
        COALESCE(final_url, 
          CASE 
            WHEN cloudinary_public_id ~~ 'stefna/%'::text THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/'::text || cloudinary_public_id)
            WHEN cloudinary_public_id IS NOT NULL AND cloudinary_public_id !~ '^stefna/' THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/stefna/'::text || cloudinary_public_id)
            ELSE NULL::text 
          END
        ) AS url,
        cloudinary_public_id, media_type, status, published_at, source_asset_id, preset_key, meta
      FROM assets 
      WHERE user_id = ${ownerId}::uuid
      ORDER BY created_at DESC
    `;
    
    return media;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Use new auth helper
    const { user } = await getAuthedUser(event); // may be null for visitors
    const params = event.queryStringParameters ?? {};
    const ownerId = params.ownerId || user?.id;
    const limit = Math.min(Number(params.limit || 50), 100);

    if (!ownerId) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, message: 'ownerId required' }) };
    }

    // Validate UUID format before database query
    if (!isValidUUID(ownerId)) {
      console.error('❌ Invalid UUID format:', ownerId);
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid user ID format' }) };
    }

    const isSelf = user?.id === ownerId;

    // Get user media with visibility filtering
    const media = await sql`
      SELECT 
        id, user_id, is_public, allow_remix, created_at, prompt,
        COALESCE(final_url, 
          CASE 
            WHEN cloudinary_public_id ~~ 'stefna/%'::text THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/'::text || cloudinary_public_id)
            WHEN cloudinary_public_id IS NOT NULL AND cloudinary_public_id !~ '^stefna/' THEN ('https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/stefna/'::text || cloudinary_public_id)
            ELSE NULL::text 
          END
        ) AS url,
        cloudinary_public_id, media_type, status, published_at, source_asset_id, preset_key, meta
      FROM assets 
      WHERE user_id = ${ownerId}::uuid
      ${isSelf ? sql`` : sql`AND is_public = true`}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Transform to match frontend expectations
    const items = (media ?? []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      type: m.media_type === 'video' ? 'video' : 'photo',
      cloudinary_public_id: m.cloudinary_public_id,
      url: m.url,
      prompt: m.prompt ?? null,
      is_public: m.is_public,
      created_at: m.created_at,
      meta: m.meta,
      // Add result_url for backward compatibility with ProfileScreen
      result_url: m.url
    }));

    // Ensure user exists in users table
    try {
      await sql`
        INSERT INTO users (id, email, external_id, created_at, updated_at)
        VALUES (${user?.id || 'unknown'}, ${user?.email || `user-${ownerId}@placeholder.com`}, ${ownerId}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          updated_at = NOW()
      `;
    } catch (userError) {
      console.error('Failed to upsert user:', userError);
      // Continue even if user upsert fails
    }

    return { statusCode: 200, body: JSON.stringify({
      ok: true,
      userId: ownerId,
      items,
      count: items.length
    }) };

  } catch (error) {
    console.error('Handler error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
