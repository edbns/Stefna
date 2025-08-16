// netlify/functions/getUserMedia.ts
import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';
import { getAuthedUser } from '../lib/auth';

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

    const isSelf = user?.id === ownerId;

    // Get user media with visibility filtering
    const media = await sql`
      SELECT 
        id, owner_id, visibility, allow_remix, created_at, env, prompt, model, mode,
        url, public_id, resource_type, folder, bytes, width, height, meta
      FROM media_assets 
      WHERE owner_id = ${ownerId}
      ${isSelf ? sql`` : sql`AND visibility = 'public'`}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Transform to match frontend expectations
    const items = (media ?? []).map((m: any) => ({
      id: m.id,
      userId: m.owner_id,
      type: m.resource_type === 'video' ? 'video' : 'photo',
      cloudinary_public_id: m.public_id,
      url: m.url,
      prompt: m.prompt ?? null,
      is_public: m.visibility === 'public',
      created_at: m.created_at,
      meta: m.meta,
      model: m.model,
      mode: m.mode
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
