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
            INSERT INTO media (
              user_id, 
              url, 
              media_type, 
              cloudinary_public_id, 
              source_public_id, 
              prompt, 
              meta, 
              preset_id, 
              run_id, 
              batch_id, 
              created_at
            ) VALUES (
              ${userId}, 
              ${variationUrl}, 
              ${media_type}, 
              ${cloudinary_public_id || null}, 
              ${source_public_id || null}, 
              ${prompt || null}, 
              ${meta || {}}, 
              ${preset_id || null}, 
              ${run_id || null}, 
              ${batch_id || null}, 
              NOW()
            ) RETURNING id, url, media_type, created_at
          `;
          
          if (result && result.length > 0) {
            savedItems.push(result[0]);
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
        INSERT INTO media (
          user_id, 
          url, 
          media_type, 
          cloudinary_public_id, 
          source_public_id, 
          prompt, 
          meta, 
          preset_id, 
          run_id, 
          batch_id, 
          created_at
        ) VALUES (
          ${userId}, 
          ${finalUrl}, 
          ${media_type}, 
          ${cloudinary_public_id || null}, 
          ${source_public_id || null}, 
          ${prompt || null}, 
          ${meta || {}}, 
          ${preset_id || null}, 
          ${run_id || null}, 
          ${batch_id || null}, 
          NOW()
        ) RETURNING id, url, media_type, created_at
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
            item: savedItem
          })
        };
      } else {
        throw new Error('No result returned from database insert');
      }
    } catch (error) {
      console.error('❌ Database insert failed:', error);
      throw httpErr(500, 'DATABASE_ERROR', 'Failed to save media to database');
    }

  } catch (error: any) {
    console.error('💥 Save media error:', error);
    
    // Handle auth errors specifically
    if (error.message === 'INVALID_JWT' || error.message === 'MISSING_BEARER') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'AUTHENTICATION_FAILED',
          message: 'Invalid or missing JWT token'
        })
      };
    }
    
    // Handle validation errors
    if (error.code === 'MISSING_URL') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.extra || 'Missing required URL field'
        })
      };
    }
    
    // Generic error response
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred'
      })
    };
  }
};
