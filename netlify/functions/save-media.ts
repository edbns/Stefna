// netlify/functions/save-media.ts
// Unified media saving function - handles both single and batch operations
// - Accepts generated media variations (from AIML and Replicate)
// - Records them in consolidated media_assets table using Prisma
// - Returns canonical items used by feed + UI

import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to detect and extract preset information from various sources
function extractPresetInfo(imageUrl: string, meta?: any, presetKey?: string): { presetKey: string | null; presetType: string } {
  // Priority 1: Use explicit preset information from meta
  if (meta?.presetId || meta?.presetKey || presetKey) {
    const extractedPresetKey = meta?.presetId || meta?.presetKey || presetKey || null;
    
    // 🔧 FIX: Map the generation type to specific preset types that PresetTag expects
    let presetType = 'custom'; // default
    
    if (meta?.mode) {
      switch (meta.mode) {
        case 'emotionmask':
          presetType = 'emotion';
          break;
        case 'ghiblireact':
          presetType = 'ghibli';
          break;
        case 'neotokyoglitch':
          presetType = 'neo-tokyo';
          break;
        case 'custom':
          presetType = 'custom';
          break;
        case 'preset':
          presetType = 'professional';
          break;
        default:
          presetType = 'custom';
      }
    } else if (meta?.generationType) {
      // 🔧 NEW: Use generationType if mode is not available
      switch (meta.generationType) {
        case 'emotionmask':
          presetType = 'emotion';
          break;
        case 'ghiblireact':
          presetType = 'ghibli';
          break;
        case 'neotokyoglitch':
          presetType = 'neo-tokyo';
          break;
        case 'custom':
          presetType = 'custom';
          break;
        case 'preset':
          presetType = 'professional';
          break;
        default:
          presetType = 'custom';
      }
    }
    
    console.log('🔧 [save-media] Extracted preset info:', {
      presetKey: extractedPresetKey,
      presetType: presetType,
      meta: meta,
      fallbackPresetKey: presetKey
    });
    
    return {
      presetKey: extractedPresetKey,
      presetType: presetType
    };
  }
  
  // Priority 2: Try to detect from URL patterns
  if (imageUrl.includes('cdn.aimlapi.com')) {
    // AIML API URLs - try to extract from path
    const urlMatch = imageUrl.match(/\/files\/([^\/]+)\//);
    if (urlMatch) {
      const detectedPreset = urlMatch[1];
      console.log('🔧 [save-media] Detected preset from AIML URL:', detectedPreset);
      return {
        presetKey: detectedPreset,
        presetType: 'professional' // Default to professional for AIML API
      };
    }
  }
  
  // Priority 3: Default fallback
  console.log('🔧 [save-media] Using default fallback preset info');
  return {
    presetKey: 'unknown',
    presetType: 'custom'
  };
}

// Helper function to upload non-Cloudinary URLs to Cloudinary
async function uploadToCloudinary(imageUrl: string, tags: string[] = [], presetInfo?: { presetKey?: string | null; presetType?: string }): Promise<{ url: string; publicId: string }> {
  try {
    console.log('☁️ [Cloudinary] Uploading external URL to Cloudinary:', imageUrl.substring(0, 60) + '...');
    
    // Enhanced tags with preset information
    const enhancedTags = [
      'auto-upload', 
      'generation',
      ...tags
    ];
    
    // Add preset-specific tags if available
    if (presetInfo?.presetKey) {
      enhancedTags.push(`preset:${presetInfo.presetKey}`);
    }
    if (presetInfo?.presetType) {
      enhancedTags.push(`type:${presetInfo.presetType}`);
    }
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      tags: enhancedTags,
      folder: 'generations',
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' }, // Auto-optimize
        { width: 1024, height: 1024, crop: 'limit' }   // Limit size for performance
      ]
    });
    
    console.log('✅ [Cloudinary] Upload successful:', {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes,
      originalSize: result.original_width + 'x' + result.original_height,
      optimizedSize: result.width + 'x' + result.height
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('❌ [Cloudinary] Upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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
  console.log('🚀 [Save Media] Handler started with method:', event.httpMethod);
  
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
  
  // 🔒 ENHANCED DEDUPLICATION: Check for duplicate requests using multiple methods
  const body = JSON.parse(event.body || '{}');
  const runId = body.runId;
  const variations = body.variations || [];
  
  // Method 1: Check runId duplicates
  if (runId) {
    console.log('🔍 [Save Media] Checking for duplicate runId:', runId);
    
    const existingMedia = await prisma.mediaAsset.findFirst({
      where: {
        meta: {
          path: ['run_id'],
          equals: runId
        }
      }
    });
    
    if (existingMedia) {
      console.log('⚠️ [Save Media] Duplicate runId detected, returning existing media:', existingMedia.id);
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          message: 'Media already saved (duplicate request)',
          results: [existingMedia],
          duplicate: true
        })
      };
    }
  }
  
  // Method 2: Check for duplicate image URLs (catches Ghibli duplicates)
  if (variations.length > 0) {
    const imageUrls = variations.map((v: any) => v.image_url).filter(Boolean);
    
    if (imageUrls.length > 0) {
      console.log('🔍 [Save Media] Checking for duplicate image URLs:', imageUrls.length);
      
      const existingDuplicates = await prisma.mediaAsset.findMany({
        where: {
          url: { in: imageUrls }
        }
      });
      
      if (existingDuplicates.length > 0) {
        console.log('⚠️ [Save Media] Duplicate image URLs detected, returning existing media:', existingDuplicates.length);
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            success: true,
            message: 'Images already saved (duplicate request)',
            results: existingDuplicates,
            duplicate: true
          })
        };
      }
    }
  }
  
  // Method 3: Check for recent duplicates (within last 30 seconds) - catches race conditions
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const recentDuplicates = await prisma.mediaAsset.findMany({
    where: {
      createdAt: {
        gte: thirtySecondsAgo
      },
      userId: body.userId || 'unknown'
    }
  });
  
  if (recentDuplicates.length > 0) {
    console.log('🔍 [Save Media] Found recent media items:', recentDuplicates.length);
    // Log recent items for debugging
    recentDuplicates.forEach((item, index) => {
      console.log(`  ${index + 1}. ID: ${item.id}, URL: ${item.url?.substring(0, 60)}..., Created: ${item.createdAt}`);
    });
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
      const batchId = crypto.randomUUID ? crypto.randomUUID() : `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

      // 🔒 ADDITIONAL DEDUPLICATION: Check for duplicate variations using image URLs
      const imageUrls = validVariations.map(v => v.image_url);
      const existingVariations = await prisma.mediaAsset.findMany({
        where: {
          url: { in: imageUrls }
        }
      });
      
      if (existingVariations.length > 0) {
        console.log('⚠️ [Batch Save] Duplicate image URLs detected, returning existing media');
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            success: true,
            message: 'Images already processed (duplicate request)',
            results: existingVariations,
            duplicate: true
          })
        };
      }

      // Insert each variation using Prisma
      for (const v of validVariations) {
        const id = crypto.randomUUID ? crypto.randomUUID() : `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const mediaType = v.media_type || 'image';
        const itemIdempotencyKey = `${runId || 'no-run'}:${v.meta?.mood || v.meta?.variation_index || Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🔍 [Batch Save] Processing variation:`, {
          id,
          mediaType,
          itemIdempotencyKey,
          imageUrl: v.image_url?.substring(0, 100) + '...',
          meta: v.meta
        });
        
        // 🚀 UNIFIED CLOUDINARY APPROACH: Upload non-Cloudinary URLs to Cloudinary
        let finalImageUrl = v.image_url;
        let cloudinaryPublicId: string | null = null;
        let presetInfo: { presetKey: string | null; presetType: string } = { presetKey: null, presetType: 'unknown' }; // Initialize presetInfo
        
        try {
          if (v.image_url.includes('cloudinary.com')) {
            // Already a Cloudinary URL - extract public ID
            const cloudinaryMatch = v.image_url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|mp4|mov|avi)/);
            cloudinaryPublicId = cloudinaryMatch ? cloudinaryMatch[1] : null;
            console.log('✅ [Batch Save] Using existing Cloudinary URL:', v.image_url.substring(0, 60) + '...');
          } else {
            // Non-Cloudinary URL (AIML, Replicate, etc.) - upload to Cloudinary
            console.log('🔄 [Batch Save] Non-Cloudinary URL detected, uploading to Cloudinary:', v.image_url.substring(0, 60) + '...');
            
            // Extract preset information using our detection function
            presetInfo = extractPresetInfo(v.image_url, v.meta, v.meta?.presetKey);
            
            console.log('🔍 [Batch Save] Extracted preset info:', presetInfo);
            
            const cloudinaryResult = await uploadToCloudinary(v.image_url, [
              'batch-upload',
              `preset:${presetInfo.presetKey || 'unknown'}`,
              `mode:${presetInfo.presetType}`
            ], presetInfo);
            
            finalImageUrl = cloudinaryResult.url;
            cloudinaryPublicId = cloudinaryResult.publicId;
            
            console.log('✅ [Batch Save] Successfully uploaded to Cloudinary:', {
              originalUrl: v.image_url.substring(0, 60) + '...',
              cloudinaryUrl: finalImageUrl.substring(0, 60) + '...',
              publicId: cloudinaryPublicId
            });
          }
        } catch (error) {
          console.error('❌ [Batch Save] Cloudinary processing failed:', error);
          // Fallback to original URL if Cloudinary fails
          cloudinaryPublicId = v.cloudinary_public_id || null;
          console.warn('⚠️ [Batch Save] Using original URL as fallback:', v.image_url.substring(0, 60) + '...');
        }
        
        // 🔒 RESPECT USER VISIBILITY PREFERENCE FOR BATCH OPERATIONS
        const userWantsPublic = v.meta?.shareNow === true; // Only public if explicitly true
        const visibility = userWantsPublic ? 'public' : 'private';
        
        console.log(`🔒 [save-media] Batch item ${id} visibility: ${userWantsPublic ? 'public' : 'private'}`);
        
        const row = await prisma.mediaAsset.create({
          data: {
            id,
            userId: userId, // Fixed: use userId not ownerId
            resourceType: mediaType,
            prompt: v.prompt || null,
            url: finalImageUrl, // ✅ Use Cloudinary URL instead of original AIML URL
            visibility: visibility, // Use user preference instead of hardcoded 'public'
            allowRemix: false,
            presetKey: presetInfo.presetKey || undefined, // ✅ Store extracted preset info for tags
            presetId: v.meta?.presetId || null, // ✅ Store actual preset ID
            parentAssetId: v.source_asset_id || null, // ✅ Link to source image
            meta: {
              ...v.meta, 
              batch_id: batchId, 
              run_id: runId, 
              idempotency_key: itemIdempotencyKey,
              original_url: v.image_url, // ✅ Keep original URL for reference
              cloudinary_public_id: cloudinaryPublicId, // ✅ Store Cloudinary public ID
              extracted_preset: presetInfo // ✅ Store extracted preset information
            }
          }
        });
        items.push(row);
        
        // ✅ UNIFIED CLOUDINARY APPROACH: All non-Cloudinary URLs are now handled above
        // No need for separate Replicate backup logic
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

      // 🚀 UNIFIED CLOUDINARY APPROACH: Upload non-Cloudinary URLs to Cloudinary
      let finalImageUrl = finalUrl;
      let cloudinary_public_id: string | null = null;
      let presetInfo: { presetKey: string | null; presetType: string } = { presetKey: null, presetType: 'unknown' }; // Initialize presetInfo
      
      if (finalUrl.includes('cloudinary.com')) {
        // Already a Cloudinary URL - validate and extract public ID
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
        // Non-Cloudinary URL (AIML, Replicate, etc.) - upload to Cloudinary
        console.log('🔄 [save-media] Non-Cloudinary URL detected, uploading to Cloudinary:', finalUrl.substring(0, 60) + '...');
        
        try {
                      // Extract preset information using our detection function
            const presetInfo = extractPresetInfo(finalUrl, meta, preset_key);
            
            console.log('🔍 [Single Save] Extracted preset info:', presetInfo);
            
            const cloudinaryResult = await uploadToCloudinary(finalUrl, [
              'single-upload',
              `preset:${presetInfo.presetKey || 'unknown'}`,
              `mode:${presetInfo.presetType}`
            ], presetInfo);
          
          finalImageUrl = cloudinaryResult.url;
          cloudinary_public_id = cloudinaryResult.publicId;
          
          console.log('✅ [save-media] Successfully uploaded to Cloudinary:', {
            originalUrl: finalUrl.substring(0, 60) + '...',
            cloudinaryUrl: finalImageUrl.substring(0, 60) + '...',
            publicId: cloudinary_public_id
          });
        } catch (error) {
          console.error('❌ [save-media] Cloudinary upload failed:', error);
          // Fallback to original URL if Cloudinary fails
          console.warn('⚠️ [save-media] Using original URL as fallback:', finalUrl.substring(0, 60) + '...');
        }
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
      // Check if user wants to share to feed (from meta.shareNow or default to private)
      const userWantsPublic = meta?.shareNow === true; // Only public if explicitly true
      const visibility = userWantsPublic ? 'public' : 'private';
      
      console.log(`🔒 [save-media] User visibility preference: ${userWantsPublic ? 'public' : 'private'}`);
      
      // Generate UUID for the new media asset
      const mediaId = crypto.randomUUID ? crypto.randomUUID() : `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔍 [save-media] Generated UUID for new media: ${mediaId}`);
      console.log(`🔍 [save-media] UUID type: ${typeof mediaId}, length: ${mediaId.length}`);
      
      const savedItem = await prisma.mediaAsset.create({
        data: {
          id: mediaId,
          userId: userId, // Fixed: use userId not ownerId
          resourceType: media_type || 'image',
          prompt: prompt || null,
          url: finalImageUrl, // ✅ Use Cloudinary URL instead of original AIML URL
          visibility: visibility, // Use user preference instead of hardcoded 'public'
          allowRemix: false,
          presetKey: presetInfo.presetKey || undefined, // ✅ Store extracted preset info for tags
          presetId: meta?.presetId || null, // ✅ Store actual preset ID
          parentAssetId: source_public_id || null, // ✅ Link to source image
          meta: { 
            ...(meta || {}), 
            idempotency_key: idempotencyKey || null,
            original_url: finalUrl, // ✅ Keep original URL for reference
            cloudinary_public_id: cloudinary_public_id, // ✅ Store Cloudinary public ID
            extracted_preset: presetInfo // ✅ Store extracted preset information
          }
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
