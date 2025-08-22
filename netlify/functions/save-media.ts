// netlify/functions/save-media.ts
// Updated to use consolidated media_assets table structure
// - Accepts generated media variations (from AIML and Replicate)
// - Records them in consolidated media_assets table
// - Returns canonical items used by feed + UI
// Force redeploy - v3 (use media_assets table instead of assets)

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
    // Use centralized auth with unified JWT approach
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
      
      // URL fields - prioritize AIML generated URL with fallback chain
      image_url,              // AIML generated image URL (primary)
      url,                    // Fallback field name for MoodMorph
      secure_url,             // Additional fallback
      final,                  // Additional fallback
      
      // Optional fields
      cloudinary_public_id,
      source_public_id,
      preset_id,
      preset_key,             // Alternative to preset_id
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

    // CRITICAL: Ensure we have a valid URL from AIML with fallback chain
    const finalUrl = image_url || url || secure_url || final;
    if (!finalUrl) {
      console.error('❌ MISSING_URL: No valid URL found in request');
      throw httpErr(400, 'MISSING_URL', 'Request must include image_url, url, secure_url, or final field with AIML generated image URL');
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
        // Use the same fallback chain for variations
        const variationUrl = variation.image_url || variation.url || variation.secure_url || variation.final;
        if (!variationUrl) {
          console.warn('⚠️ Skipping variation without URL:', variation);
          continue;
        }

        try {
          const result = await sql`
            INSERT INTO media_assets (
              user_id, 
              cloudinary_public_id, 
              media_type, 
              preset_key, 
              prompt, 
              source_asset_id, 
              status, 
              is_public, 
              allow_remix,
              final_url,
              meta,
              created_at
            ) VALUES (
              ${userId}, 
              ${cloudinary_public_id || null}, 
              ${media_type}, 
              ${preset_key || preset_id || null}, 
              ${prompt || null}, 
              ${source_public_id || null}, 
              'ready', 
              true, 
              false,
              ${variationUrl},
              ${meta || {}},
              NOW()
            ) RETURNING id, final_url, media_type, created_at
          `;
          
          if (result && result.length > 0) {
            savedItems.push({
              id: result[0].id,
              url: result[0].final_url,
              media_type: result[0].media_type,
              created_at: result[0].created_at
            });
            console.log('✅ Variation saved:', result[0].id);
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
          success: true,
          message: `Saved ${savedItems.length} variations`,
          items: savedItems,
          total_requested: variations.length,
          total_saved: savedItems.length
        })
      };
    }

    // Single media item
    try {
      const result = await sql`
        INSERT INTO media_assets (
          user_id, 
          cloudinary_public_id, 
          media_type, 
          preset_key, 
          prompt, 
          source_asset_id, 
          status, 
          is_public, 
          allow_remix,
          final_url,
          meta,
          created_at
        ) VALUES (
          ${userId}, 
          ${cloudinary_public_id || null}, 
          ${media_type}, 
          ${preset_key || preset_id || null}, 
          ${prompt || null}, 
          ${source_public_id || null}, 
          'ready', 
          true, 
          false,
          ${finalUrl},
          ${meta || {}},
          NOW()
        ) RETURNING id, final_url, media_type, created_at
      `;
    
      if (result && result.length > 0) {
        const savedItem = result[0];
        console.log('✅ Media saved successfully:', savedItem.id);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            message: 'Media saved successfully',
            id: savedItem.id,
            final_url: savedItem.final_url,
            media_type: savedItem.media_type,
            created_at: savedItem.created_at,
            table_used: 'media_assets' // Indicate we're using the new structure
          })
        };
      } else {
        throw new Error('No result returned from database insert');
      }
    } catch (error) {
      console.error('❌ Failed to save media:', error);
      throw httpErr(500, 'SAVE_FAILED', `Failed to save media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error: unknown) {
    console.error('❌ save-media error:', error);
    
    // Check if this is already an HTTP error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const httpError = error as { statusCode: number; error?: string; message?: string };
      return {
        statusCode: httpError.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: httpError.error || 'Unknown error',
          message: httpError.message || 'An error occurred while saving media'
        })
      };
    }
    
    // Generic error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An internal error occurred while saving media'
      })
    };
  }
};
