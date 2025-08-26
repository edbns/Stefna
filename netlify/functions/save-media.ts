// netlify/functions/save-media.ts
// Unified media saving function - handles both single and batch operations
// - Accepts generated media variations (from AIML and Replicate)
// - Records them in consolidated media_assets table using Prisma
// - Returns canonical items used by feed + UI

import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface MediaVariation {
  image_url: string;
  prompt?: string;
  preset_id?: string;
  media_type?: string;
  source_asset_id?: string;
  cloudinary_public_id?: string;
  meta?: any;
}

interface SaveRequest {
  // Single media
  finalUrl?: string;
  media_type?: string;
  preset_key?: string;
  prompt?: string;
  source_public_id?: string;
  meta?: any;
  
  // Batch media
  variations?: MediaVariation[];
  runId?: string;
  
  // Common
  userId?: string; // For direct calls
}

export const handler: Handler = async (event): Promise<any> => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const body: SaveRequest = JSON.parse(event.body || '{}');
    
    // Extract idempotency key from header
    const idempotencyKey = event.headers['x-idempotency-key'] || event.headers['X-Idempotency-Key'];
    
    // 🔍 DUPLICATION INVESTIGATION: Log all save-media calls
    console.log('🔍 [save-media] Called with body:', JSON.stringify(body, null, 2));
    console.log('🔍 [save-media] Idempotency key:', idempotencyKey);
    console.log('🔍 [save-media] Timestamp:', new Date().toISOString());
    console.log('🔍 [save-media] Request ID:', Math.random().toString(36).substr(2, 9));
    
    // Extract user ID from auth header or request body
    let userId: string;
    if (body.userId) {
      userId = body.userId;
    } else {
      // Extract from auth header
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing or invalid authorization header' })
        };
      }
      
      // Simple JWT decode (in production, use proper JWT verification)
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.userId || payload.sub;
      } catch (error) {
        return {
          statusCode: 401,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Invalid token format' })
        };
      }
    }

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing userId' })
      };
    }
    
    // 🛡️ IDEMPOTENCY CHECK: Prevent duplicate saves
    if (idempotencyKey) {
      console.log(`🔍 Checking idempotency for key: ${idempotencyKey}`);
    }

    // Determine if this is a batch or single operation
    const isBatch = body.variations && Array.isArray(body.variations) && body.variations.length > 0;
    
    if (isBatch) {
      // BATCH OPERATION
      console.log(`🔄 Batch save operation: ${body.variations!.length} variations for user ${userId}`);
      
      const { variations, runId } = body;
      const batchId = randomUUID();
      const items: any[] = [];
      
      // Validate variations
      if (!variations || variations.length === 0) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Variations array is required and must not be empty' })
        };
      }

      // Filter out variations with invalid source_asset_id
      const validVariations = variations.filter(v => {
        if (!v.source_asset_id) return true; // Allow variations without source
        return typeof v.source_asset_id === 'string' && v.source_asset_id.length > 0;
      });

      if (validVariations.length !== variations.length) {
        console.warn(`⚠️ Filtered out ${variations.length - validVariations.length} variations with invalid source_asset_id`);
        console.log('🔍 [Batch Save] Invalid variations details:', variations.filter(v => !v.source_asset_id || (typeof v.source_asset_id === 'string' && v.source_asset_id.length === 0)));
      }

      if (validVariations.length === 0) {
        console.error('❌ [Batch Save] No valid variations to insert after filtering');
        console.log('🔍 [Batch Save] All variations were invalid:', variations);
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'No valid variations to insert' }),
        };
      }

      console.log(`✅ [Batch Save] Proceeding with ${validVariations.length} valid variations`);

      // Insert each variation using Prisma
      for (const v of validVariations) {
        const id = randomUUID();
        const mediaType = v.media_type || 'image';
        const itemIdempotencyKey = `${runId || 'no-run'}:${v.meta?.mood || v.meta?.variation_index || Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🔍 [Batch Save] Processing variation:`, {
          id,
          mediaType,
          itemIdempotencyKey,
          imageUrl: v.image_url?.substring(0, 100) + '...',
          meta: v.meta
        });
        
        // Extract Cloudinary public ID from the image URL or handle non-Cloudinary URLs
        let cloudinaryPublicId: string | null = null;
        try {
          if (v.image_url.includes('cloudinary.com')) {
            const cloudinaryMatch = v.image_url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|mp4|mov|avi)/);
            cloudinaryPublicId = cloudinaryMatch ? cloudinaryMatch[1] : null;
          }
        } catch (error) {
          console.warn(`⚠️ Could not analyze URL: ${v.image_url}`, error);
          cloudinaryPublicId = v.cloudinary_public_id || null;
        }
        
        // 🔒 RESPECT USER VISIBILITY PREFERENCE FOR BATCH OPERATIONS
        const userWantsPublic = v.meta?.shareNow !== undefined ? v.meta.shareNow : true;
        const visibility = userWantsPublic ? 'public' : 'private';
        
        console.log(`🔒 [save-media] Batch item ${id} visibility: ${userWantsPublic ? 'public' : 'private'}`);
        
        const row = await prisma.mediaAsset.create({
          data: {
            id,
            userId: userId, // Fixed: use userId not ownerId
            resourceType: mediaType,
            prompt: v.prompt || null,
            url: v.image_url,
            visibility: visibility, // Use user preference instead of hardcoded 'public'
            allowRemix: false,
            meta: {...v.meta, batch_id: batchId, run_id: runId, idempotency_key: itemIdempotencyKey}
          }
        });
        items.push(row);
        
        // 🔄 Auto-backup Replicate images to Cloudinary
        if (v.image_url && v.image_url.includes('replicate.delivery')) {
          console.log('🔄 Triggering Replicate image backup for:', { id, imageUrl: v.image_url });
          
          // Call backup function asynchronously (don't wait for it)
          fetch('/.netlify/functions/backup-replicate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              replicateUrl: v.image_url,
              mediaId: id,
              userId: userId
            })
          }).then(response => {
            if (response.ok) {
              console.log('✅ Replicate backup triggered successfully for:', id);
            } else {
              console.error('❌ Replicate backup trigger failed for:', id, response.status);
            }
          }).catch(error => {
            console.error('❌ Replicate backup trigger error for:', id, error);
          });
        }
      }
      
      console.log(`✅ Batch save completed: ${items.length} variations for user ${userId}, run ${runId || 'no-run'}`);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: `Saved ${items.length} variations`,
          count: items.length,
          batchId,
          items: items.map(item => ({
            id: item.id,
            final_url: item.url,
            media_type: item.resourceType,
            created_at: item.created_at
          }))
        })
      };
      
    } else {
      // SINGLE OPERATION
      console.log(`🔄 Single save operation for user ${userId}`);
      
      const { finalUrl, media_type, preset_key, prompt, source_public_id, meta } = body;
      
      if (!finalUrl) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'finalUrl is required' })
        };
      }

      // 🛡️ IDEMPOTENCY CHECK: Prevent duplicate saves
      if (idempotencyKey) {
        console.log(`🔍 [save-media] Checking idempotency for key: ${idempotencyKey}`);
        
        // Check if an item with this idempotency key already exists
        const existingItem = await prisma.mediaAsset.findFirst({
          where: {
            meta: {
              path: ['idempotency_key'],
              equals: idempotencyKey
            }
          },
          select: {
            id: true,
            url: true, // Changed from finalUrl
            resourceType: true, // Changed from mediaType
            createdAt: true
          }
        });
        
        if (existingItem) {
          console.log(`✅ [save-media] Idempotency check: Item already exists with key ${idempotencyKey}`);
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              message: 'Item already exists (idempotency)',
              id: existingItem.id,
              final_url: existingItem.url, // Changed from finalUrl
              media_type: existingItem.resourceType, // Changed from mediaType
              created_at: existingItem.createdAt,
              table_used: 'media_assets',
              idempotency: true
            })
          };
        }
      } else {
        console.log(`⚠️ [save-media] No idempotency key provided - potential duplicate risk`);
      }

      // 🛡️ ADDITIONAL DUPLICATE PREVENTION: Check for existing URL
      console.log(`🔍 [save-media] Checking for existing URL: ${finalUrl}`);
      const existingUrlCheck = await prisma.mediaAsset.findFirst({
        where: { url: finalUrl },
        select: {
          id: true,
          userId: true, // Fixed: use userId not ownerId
          createdAt: true
        }
      });
      
      if (existingUrlCheck) {
        console.log(`⚠️ [save-media] URL already exists in database: ${existingUrlCheck.id}`);
        console.log(`⚠️ [save-media] User: ${existingUrlCheck.userId}, Created: ${existingUrlCheck.createdAt}`);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            message: 'URL already exists in database',
            id: existingUrlCheck.id,
            final_url: finalUrl,
            created_at: existingUrlCheck.createdAt,
            table_used: 'media_assets',
            duplicate_prevention: true
          })
        };
      }

      // 🚨 CRITICAL FIX: Validate and complete Cloudinary URLs
      let validatedFinalUrl = finalUrl;
      let cloudinary_public_id: string | null = null;
      
      if (finalUrl.includes('cloudinary.com')) {
        // Check if URL is complete
        if (!finalUrl.includes('/upload/')) {
          console.error('❌ [save-media] Incomplete Cloudinary URL detected:', finalUrl);
          return {
            statusCode: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ 
              error: 'Incomplete Cloudinary URL',
              details: 'URL is missing /upload/ path',
              receivedUrl: finalUrl
            })
          };
        }
        
        // Extract Cloudinary public ID
        const cloudinaryMatch = finalUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|mp4|mov|avi)/);
        cloudinary_public_id = cloudinaryMatch ? cloudinaryMatch[1] : null;
        
        if (!cloudinary_public_id) {
          console.error('❌ [save-media] Could not extract Cloudinary public ID from URL:', finalUrl);
          return {
            statusCode: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ 
              error: 'Invalid Cloudinary URL format',
              details: 'Could not extract public ID',
              receivedUrl: finalUrl
            })
          };
        }
        
        console.log('✅ [save-media] Valid Cloudinary URL:', finalUrl);
        console.log('✅ [save-media] Extracted public ID:', cloudinary_public_id);
      } else {
        console.log('⚠️ [save-media] Non-Cloudinary URL detected:', finalUrl);
      }

      // 🧠 DEBUG: Special logging for Neo Tokyo Glitch mode
      if (meta?.mode === 'neotokyoglitch') {
        console.log('🎭 [save-media] NEO TOKYO GLITCH MODE DETECTED');
        console.log('🎭 [save-media] Meta details:', JSON.stringify(meta, null, 2));
        console.log('🎭 [save-media] This should link media to user profile');
      }

      // Insert the media
      console.log(`🔍 [save-media] Inserting media with finalUrl: ${finalUrl}`);
      console.log(`🔍 [save-media] User ID: ${userId}, Preset: ${preset_key}`);
      
      // 🔒 RESPECT USER VISIBILITY PREFERENCE
      // Check if user wants to share to feed (from meta.shareNow or default to public)
      const userWantsPublic = meta?.shareNow !== undefined ? meta.shareNow : true;
      const visibility = userWantsPublic ? 'public' : 'private';
      
      console.log(`🔒 [save-media] User visibility preference: ${userWantsPublic ? 'public' : 'private'}`);
      
      const savedItem = await prisma.mediaAsset.create({
        data: {
          id: randomUUID(),
          userId: userId, // Fixed: use userId not ownerId
          resourceType: media_type || 'image',
          prompt: prompt || null,
          url: finalUrl,
          visibility: visibility, // Use user preference instead of hardcoded 'public'
          allowRemix: false,
          presetKey: preset_key || null, // ✅ FIXED: Store preset key for tag display
          meta: { ...(meta || {}), idempotency_key: idempotencyKey || null }
        },
        select: {
          id: true,
          url: true,
          resourceType: true,
          createdAt: true
        }
      });

      console.log(`✅ [save-media] Media saved successfully with ID: ${savedItem.id}`);
      
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
          final_url: savedItem.url,
          media_type: savedItem.resourceType,
          created_at: savedItem.createdAt,
          table_used: 'media_assets'
        })
      };
    }

  } catch (error: unknown) {
    console.error('❌ save-media error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: 'SAVE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
