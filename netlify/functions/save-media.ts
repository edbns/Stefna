// netlify/functions/save-media.ts
// Neon-focused media saving endpoint with proper URL handling
// - Accepts generated media variations (from AIML)
// - Records them in Neon database with proper schema
// - Returns canonical items used by feed + UI

import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireAuth, httpErr } from './_auth';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-idempotency-key, X-Idempotency-Key',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Use centralized auth
    const { userId } = requireAuth(event.headers.authorization);
    console.log('✅ User authenticated:', userId);

    // Get idempotency key from headers or generate one
    const idem = event.headers['x-idempotency-key'] || 
                 event.headers['X-Idempotency-Key'] || 
                 crypto.randomUUID();

    const body = JSON.parse(event.body || '{}');
    console.log('📥 Save media request body:', body);

    const {
      // Core fields
      prompt,
      media_type = 'image',
      meta = {},
      
      // URL fields - prioritize AIML generated URL
      image_url,              // AIML generated image URL (primary)
      url,                    // Fallback field name for MoodMorph
      
      // Optional fields
      cloudinary_public_id,
      source_public_id,
      preset_id,
      run_id,
      batch_id,
      
      // MoodMorph specific
      variations,
      runId,
      presetId,
      
      // Legacy fields
      tags,
      extra
    } = body;

    // CRITICAL: Ensure we have a valid URL from AIML
    const finalUrl = image_url || url;
    if (!finalUrl) {
      console.error('❌ MISSING_URL: No valid URL found in request');
      throw httpErr(400, 'MISSING_URL', 'Request must include image_url or url field with AIML generated image URL');
    }

    console.log('🔗 Using URL:', finalUrl);

    // Handle MoodMorph variations
    if (variations && Array.isArray(variations)) {
      console.log('🎭 Processing MoodMorph variations:', variations.length);
      
      const savedItems: Array<{
        id: string;
        url: string;
        media_type: string;
        created_at: string;
      }> = [];
      
      for (const variation of variations) {
        const variationUrl = variation.url || variation.image_url;
        if (!variationUrl) {
          console.warn('⚠️ Skipping variation without URL:', variation);
          continue;
        }

        try {
          const result = await sql`
            INSERT INTO media (
              user_id, 
              url, 
              media_type, 
              cloudinary_public_id, 
              source_public_id, 
              preset_id, 
              idempotency_key,
              prompt,
              meta,
              run_id,
              batch_id
            )
            VALUES (
              ${userId}, 
              ${variationUrl}, 
              ${variation.type || media_type}, 
              ${variation.cloudinary_public_id || cloudinary_public_id}, 
              ${variation.source_public_id || source_public_id}, 
              ${variation.preset_id || preset_id || presetId}, 
              ${idem + '-' + Math.random()}, 
              ${variation.prompt || prompt}, 
              ${JSON.stringify({ ...meta, ...variation.meta, ...variation.extra })}, 
              ${variation.run_id || run_id || runId}, 
              ${batch_id}
            )
            ON CONFLICT (idempotency_key) DO UPDATE SET 
              updated_at = now()
            RETURNING id, url, media_type, created_at
          `;

          if (result && result[0]) {
            savedItems.push({
              id: result[0].id,
              url: result[0].url,
              media_type: result[0].media_type,
              created_at: result[0].created_at
            });
            console.log('✅ Saved variation:', result[0].id);
          }
        } catch (error) {
          console.error('❌ Failed to save variation:', error);
          // Continue with other variations
        }
      }

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          ok: true, 
          message: `Saved ${savedItems.length} variations`,
          items: savedItems,
          total: savedItems.length
        })
      };

    } else {
      // Single media item
      try {
        const result = await sql`
          INSERT INTO media (
            user_id, 
            url, 
            media_type, 
            cloudinary_public_id, 
            source_public_id, 
            preset_id, 
            idempotency_key,
            prompt,
            meta,
            run_id,
            batch_id
          )
          VALUES (
            ${userId}, 
            ${finalUrl}, 
            ${media_type}, 
            ${cloudinary_public_id}, 
            ${source_public_id}, 
            ${preset_id || presetId}, 
            ${idem}, 
            ${prompt}, 
            ${JSON.stringify(meta)}, 
            ${run_id || runId}, 
            ${batch_id}
          )
          ON CONFLICT (idempotency_key) DO UPDATE SET 
            updated_at = now()
          RETURNING id, url, media_type, created_at
        `;

        if (result && result[0]) {
          console.log('✅ Saved single media item:', result[0].id);
          return {
            statusCode: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
              ok: true, 
              media: result[0],
              message: 'Media saved successfully'
            })
          };
        } else {
          throw new Error('No result returned from database insert');
        }
      } catch (error) {
        console.error('❌ Database error:', error);
        throw httpErr(500, 'DATABASE_ERROR', error.message);
      }
    }

  } catch (error: any) {
    console.error('❌ Save media error:', error);
    const status = error.statusCode || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const details = error.extra || error.message;
    
    return {
      statusCode: status,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        error: code,
        details: details
      })
    };
  }
};
