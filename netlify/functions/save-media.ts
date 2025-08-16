// netlify/functions/save-media.ts
// One-stop "save + record" endpoint.
// - Accepts generated media variations (from AIML).
// - Uploads them to Cloudinary (by remote URL).
// - If Authorization present, records them in DB.
// - Returns canonical items used by feed + UI.
// Compatible with Netlify Functions v1/v2.

import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';
import { requireUser } from '../lib/auth';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Use the new robust auth helper
    const user = await requireUser(event);
    console.log('✅ User authenticated:', user.id);

    const body = JSON.parse(event.body || '{}');
    console.log('📥 Save media request body:', body);

    const {
      // from client
      prompt,
      allowPublish = true,
      // either (a) final hosted URL from AIML or (b) a Cloudinary public id if you reuploaded it
      image_url,              // e.g. https://cdn.aimlapi.com/...
      cloudinary_public_id,   // optional
      media_type = 'image',   // 'image' | 'video'
      meta = null,
      source_public_id = null,
      // MoodMorph specific
      variations,
      runId,
      presetId,
      allowPublish: allowPublishOverride,
      tags,
      extra
    } = body;

    // Create media table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
        cloudinary_public_id TEXT,
        final_url TEXT,
        prompt TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        source_public_id TEXT,
        meta JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    let items = [];

    // Handle MoodMorph variations
    if (variations && Array.isArray(variations)) {
      console.log('🎭 Processing MoodMorph variations:', variations.length);
      
      for (const variation of variations) {
        const {
          url,
          type = 'image',
          is_public = false,
          meta: variationMeta = {}
        } = variation;

        if (!url) {
          console.warn('⚠️ Skipping variation without URL:', variation);
          continue;
        }

        const row = await sql`
          INSERT INTO media (user_id, media_type, cloudinary_public_id, final_url, prompt, is_public, source_public_id, meta)
          VALUES (
            ${user.id},
            ${type},
            ${cloudinary_public_id || null},
            ${url},
            ${prompt || null},
            ${allowPublishOverride !== undefined ? allowPublishOverride : allowPublish},
            ${source_public_id},
            ${JSON.stringify({ ...variationMeta, runId, presetId, tags, extra })}
          )
          RETURNING *
        `;

        const mediaItem = row[0];
        const displayUrl = mediaItem.final_url || (mediaItem.cloudinary_public_id
          ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${mediaItem.cloudinary_public_id}.jpg`
          : null);

        items.push({
          id: mediaItem.id,
          userId: mediaItem.user_id,
          type: mediaItem.media_type === 'video' ? 'video' : 'photo',
          url: displayUrl,
          cloudinary_public_id: mediaItem.cloudinary_public_id,
          prompt: mediaItem.prompt || '',
          createdAt: mediaItem.created_at,
          isPublic: mediaItem.is_public,
          meta: mediaItem.meta
        });
      }
    } else {
      // Handle single media item
      const row = await sql`
        INSERT INTO media (user_id, media_type, cloudinary_public_id, final_url, prompt, is_public, source_public_id, meta)
        VALUES (
          ${user.id},
          ${media_type},
          ${cloudinary_public_id || null},
          ${image_url || null},
          ${prompt || null},
          ${allowPublish},
          ${source_public_id},
          ${meta}
        )
        RETURNING *
      `;

      const mediaItem = row[0];
      const displayUrl = mediaItem.final_url || (mediaItem.cloudinary_public_id
        ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${mediaItem.cloudinary_public_id}.jpg`
        : null);

      items.push({
        id: mediaItem.id,
        userId: mediaItem.user_id,
        type: mediaItem.media_type === 'video' ? 'video' : 'photo',
        url: displayUrl,
        cloudinary_public_id: mediaItem.cloudinary_public_id,
        prompt: mediaItem.prompt || '',
        createdAt: mediaItem.created_at,
        isPublic: mediaItem.is_public,
        meta: mediaItem.meta
      });
    }

    console.log('✅ Saved media items:', items.length);

    // Return both keys to satisfy old/new clients
    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: true, 
        items: items, 
        data: items,
        count: items.length
      }) 
    };

  } catch (error: any) {
    console.error('❌ Save media error:', error);
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        error: 'Save media failed',
        message: error.message || 'Unknown error'
      }) 
    };
  }
};
