// netlify/functions/unified-generate-background.ts
// Unified AI Media Generation - Background Function
// 
// 🎯 FEATURES:
// - Long-running generations (up to 15 minutes)
// - Credit reservation and finalization
// - 3-tier Stability.ai fallback (Ultra → Core → SD3)
// - Fal.ai fallback for all modes
// - Comprehensive error handling and logging
// - Timeout protection

import { Handler } from '@netlify/functions';
// Switch from SDK to REST to avoid client-side quirks and to control retries
// Use global fetch/Response/FormData available in Node 18+
import { q, qOne } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from './_withAuth';

const FAL_BASE = 'https://fal.run';
const FAL_KEY = process.env.FAL_KEY as string;
const HYPER_SDXL_ALLOWED_STEPS = new Set([1, 2, 4]);
const isHyperSDXLModel = (model: string) => model === 'fal-ai/hyper-sdxl/image-to-image';

const CORS_JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
} as const;
async function falInvoke(model: string, input: any): Promise<any> {
  const url = `${FAL_BASE}/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${FAL_KEY}`
    },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fal REST ${res.status}: ${text.substring(0, 200)}`);
  }
  return await res.json();
}

// Generation mode types
type GenerationMode = 
  | 'presets' 
  | 'custom' 
  | 'emotion_mask' 
  | 'ghibli_reaction' 
  | 'story_time' 
  | 'neo_glitch';

interface UnifiedGenerationRequest {
  mode: GenerationMode;
  prompt: string;
  presetKey?: string;
  sourceAssetId?: string;
  userId: string;
  runId: string;
  emotionMaskPresetId?: string;
  ghibliReactionPresetId?: string;
  storyTimePresetId?: string;
  additionalImages?: string[];
  meta?: any;
}

interface UnifiedGenerationResponse {
  success: boolean;
  status: 'done' | 'failed' | 'timeout';
  provider?: string;
  outputUrl?: string;
  error?: string;
  runId?: string;
}

// Mode-specific FAL.ai model configurations
const PHOTO_MODELS = [
  {
    model: 'fal-ai/hyper-sdxl/image-to-image',
    name: 'Hyper SDXL I2I',
    cost: 'medium',
    priority: 1,
    description: 'High-quality photo-realistic image-to-image'
  },
  {
    model: 'fal-ai/pixart-alpha',
    name: 'PixArt Alpha',
    cost: 'medium',
    priority: 2,
    description: 'Reliable SDXL-style fallback'
  },
  // Remove invalid model 'stable-diffusion-xl' to prevent 404
];

const GHIBLI_MODELS = [
  {
    model: 'fal-ai/hyper-sdxl/image-to-image',
    name: 'Hyper SDXL I2I',
    cost: 'medium',
    priority: 1,
    description: 'High-quality image-to-image with subtle Ghibli elements'
  },
  {
    model: 'fal-ai/pixart-alpha',
    name: 'PixArt Alpha',
    cost: 'medium',
    priority: 2,
    description: 'Reliable SDXL-style with gentle Ghibli influence'
  }
];

const VIDEO_MODELS = [
  {
    model: 'fal-ai/fast-sdxl',
    name: 'Fast SDXL',
    cost: 'low',
    priority: 1,
    description: 'Fast video generation from images'
  }
];

// Helper function for Stability.ai requests
async function makeStabilityRequest(tier: string, params: any, apiKey: string): Promise<Response> {
  const MODEL_ENDPOINTS = {
    ultra: "https://api.stability.ai/v2beta/stable-image/generate/ultra",
    core: "https://api.stability.ai/v2beta/stable-image/generate/core", 
    sd3: "https://api.stability.ai/v2beta/stable-image/generate/sd3",
  };

  const form = new FormData();
  // Allow caller to provide full prompt and parameters per mode
  form.append("prompt", params.prompt);
  form.append("init_image", params.sourceAssetId);
  form.append("image_strength", String(params.image_strength ?? 0.7));
  form.append("steps", String(params.steps ?? 30));
  form.append("cfg_scale", String(params.guidance_scale ?? 7.5));
  form.append("samples", "1");

  return fetch(MODEL_ENDPOINTS[tier as keyof typeof MODEL_ENDPOINTS], {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    body: form,
    // Tight per-call timeout (30s)
    signal: AbortSignal.timeout(30000)
  });
}

// Cloudinary upload helper - using signed uploads
async function uploadBase64ToCloudinary(base64Data: string): Promise<string> {
  try {
    console.log('☁️ [Cloudinary] Starting signed upload for generated image');

    // Get signed upload parameters
    const signUrl = process.env.URL
      ? `${process.env.URL}/.netlify/functions/cloudinary-sign`
      : `https://${process.env.CONTEXT === 'production' ? '' : process.env.BRANCH + '--'}stefna.netlify.app/.netlify/functions/cloudinary-sign`;

    console.log('🔐 [Cloudinary] Using sign URL:', signUrl);

    const signResponse = await fetch(signUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'stefna/generated' })
    });

    if (!signResponse.ok) {
      const errorText = await signResponse.text();
      throw new Error(`Cloudinary sign failed: ${signResponse.status} - ${errorText}`);
    }

    let signData;
    try {
      signData = await signResponse.json();
    } catch (parseError) {
      console.error('❌ [Cloudinary] Failed to parse sign response:', parseError);
      throw new Error('Invalid response from Cloudinary sign service');
    }

    if (!signData || !signData.cloudName || !signData.apiKey || !signData.signature) {
      console.error('❌ [Cloudinary] Invalid sign data:', signData);
      throw new Error('Missing required Cloudinary sign parameters');
    }

    // Prepare signed upload
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'generated.png');
    formData.append('timestamp', signData.timestamp);
    formData.append('signature', signData.signature);
    formData.append('api_key', signData.apiKey);
    formData.append('folder', 'stefna/generated');

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ [Cloudinary] Upload response not OK:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText: errorText.substring(0, 200)
      });
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    let uploadResult;
    try {
      uploadResult = await uploadResponse.json();
    } catch (parseError) {
      console.error('❌ [Cloudinary] Failed to parse upload response:', parseError);
      throw new Error('Invalid response from Cloudinary upload');
    }

    if (!uploadResult || !uploadResult.secure_url) {
      console.error('❌ [Cloudinary] No secure_url in upload result:', uploadResult);
      throw new Error('Cloudinary upload succeeded but no URL returned');
    }

    console.log('✅ [Cloudinary] Signed upload successful:', uploadResult.secure_url);
    return uploadResult.secure_url;
  } catch (error: any) {
    console.error('❌ [Background] Cloudinary signed upload error:', error);
    throw error;
  }
}

// Upload a remote image URL to Cloudinary (URL → Blob → signed upload)
async function uploadUrlToCloudinary(imageUrl: string): Promise<string> {
  // If already Cloudinary, return as-is
  if (imageUrl.includes('res.cloudinary.com')) return imageUrl;

  const signUrl = process.env.URL
    ? `${process.env.URL}/.netlify/functions/cloudinary-sign`
    : `https://${process.env.CONTEXT === 'production' ? '' : process.env.BRANCH + '--'}stefna.netlify.app/.netlify/functions/cloudinary-sign`;

  const signResponse = await fetch(signUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'stefna/generated' })
  });
  if (!signResponse.ok) {
    const errorText = await signResponse.text();
    throw new Error(`Cloudinary sign failed: ${signResponse.status} - ${errorText}`);
  }
  const signData = await signResponse.json();

  const remoteRes = await fetch(imageUrl);
  if (!remoteRes.ok) {
    const t = await remoteRes.text();
    throw new Error(`Failed to fetch remote image: ${remoteRes.status} - ${t.substring(0,200)}`);
  }
  const blob = await remoteRes.blob();
  const formData = new FormData();
  formData.append('file', blob, 'generated.png');
  formData.append('timestamp', signData.timestamp);
  formData.append('signature', signData.signature);
  formData.append('api_key', signData.apiKey);
  formData.append('folder', 'stefna/generated');

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Cloudinary upload failed: ${uploadResponse.status} - ${errorText.substring(0,200)}`);
  }
  const uploadResult = await uploadResponse.json();
  if (!uploadResult.secure_url) throw new Error('Cloudinary upload returned no secure_url');
  return uploadResult.secure_url;
}

// Centralized credit handling
async function reserveCredits(userId: string, action: string, creditsNeeded: number, requestId: string): Promise<boolean> {
  try {
    console.log(`💰 [Background] Reserving ${creditsNeeded} credits for ${action}`);
    
    // Check user's current credit balance
    const userCredits = await qOne(`
      SELECT user_id, credits, balance FROM user_credits WHERE user_id = $1
    `, [userId]);

    if (!userCredits) {
      // Initialize user credits if they don't exist
      console.log('💰 [Background] No credit balance found - initializing new user with starter credits...');
      
      const newUserCredits = await qOne(`
        INSERT INTO user_credits (user_id, credits, balance, updated_at)
        VALUES ($1, 30, 0, NOW())
        RETURNING user_id, credits, balance
      `, [userId]);
      
      if (!newUserCredits) {
        throw new Error('Failed to initialize user credits');
      }
      
      console.log(`✅ [Background] Successfully initialized user with 30 starter credits`);
    }

    const currentCredits = userCredits?.credits || 0;
    console.log(`💰 [Background] Current daily credits: ${currentCredits}, needed: ${creditsNeeded}`);

    if (currentCredits < creditsNeeded) {
      throw new Error(`Insufficient credits: ${currentCredits} available, ${creditsNeeded} needed`);
    }

    // Create credit reservation
    await q(`
      INSERT INTO credits_ledger (user_id, action, amount, status, request_id, created_at)
      VALUES ($1, $2, $3, 'reserved', $4, NOW())
    `, [userId, action, creditsNeeded, requestId]);

    // Update user daily credits
    await q(`
      UPDATE user_credits 
      SET credits = credits - $1, updated_at = NOW()
      WHERE user_id = $2
    `, [creditsNeeded, userId]);

    console.log(`✅ [Background] Credits reserved successfully`);
    return true;
  } catch (error) {
    console.error(`❌ [Background] Credit reservation failed:`, error);
    throw error;
  }
}

async function finalizeCredits(userId: string, action: string, requestId: string, success: boolean): Promise<void> {
  try {
    console.log(`💰 [Background] Finalizing credits for ${action}, success: ${success}`);

    if (success) {
      // Mark reservation as completed
      await q(`
        UPDATE credits_ledger
        SET status = 'completed', updated_at = NOW()
        WHERE user_id = $1 AND request_id = $2 AND status = 'reserved'
      `, [userId, requestId]);
    } else {
      // Refund credits on failure
      const reservation = await qOne(`
        SELECT amount FROM credits_ledger
        WHERE user_id = $1 AND request_id = $2 AND status = 'reserved'
      `, [userId, requestId]);

      if (reservation) {
        await q(`
          UPDATE user_credits
          SET credits = credits + $1, updated_at = NOW()
          WHERE user_id = $2
        `, [reservation.amount, userId]);

        await q(`
          UPDATE credits_ledger
          SET status = 'refunded', updated_at = NOW()
          WHERE user_id = $1 AND request_id = $2 AND status = 'reserved'
        `, [userId, requestId]);
      }
    }

    console.log(`✅ [Background] Credits finalized successfully`);
  } catch (error) {
    console.error(`❌ [Background] Credit finalization failed:`, error);
  }
}

// Save generation result to appropriate database table
async function saveGenerationResult(request: UnifiedGenerationRequest, result: UnifiedGenerationResponse): Promise<void> {
  try {
    console.log(`💾 [Background] Saving generation result to database:`, {
      mode: request.mode,
      hasOutput: !!result.outputUrl,
      runId: request.runId
    });

    const baseData = {
      user_id: request.userId,
      image_url: result.outputUrl,
      source_url: request.sourceAssetId,
      prompt: request.prompt,
      preset: request.presetKey || 'default',
      run_id: request.runId,
      status: 'completed',
      metadata: JSON.stringify(request.meta || {})
    };

    switch (request.mode) {
      case 'neo_glitch':
        await q(`
          INSERT INTO neo_glitch_media (
            user_id, image_url, source_url, prompt, preset, run_id, stability_job_id, status, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          baseData.user_id,
          baseData.image_url,
          baseData.source_url,
          baseData.prompt,
          baseData.preset,
          baseData.run_id,
          request.runId, // Use runId as stability_job_id
          baseData.status,
          baseData.metadata
        ]);
        console.log(`✅ [Background] Saved neo_glitch result to database`);
        break;

      case 'presets':
        await q(`
          INSERT INTO presets_media (
            user_id, image_url, source_url, prompt, preset, run_id, fal_job_id, status, preset_week, preset_rotation_index, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          baseData.user_id,
          baseData.image_url,
          baseData.source_url,
          baseData.prompt,
          baseData.preset,
          baseData.run_id,
          result.runId || request.runId, // fal_job_id
          baseData.status,
          1, // preset_week (default)
          1, // preset_rotation_index (default)
          baseData.metadata
        ]);
        console.log(`✅ [Background] Saved presets result to database`);
        break;

      case 'custom':
        await q(`
          INSERT INTO custom_prompt_media (
            user_id, image_url, source_url, prompt, preset, run_id, fal_job_id, status, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          baseData.user_id,
          baseData.image_url,
          baseData.source_url,
          baseData.prompt,
          'custom',
          baseData.run_id,
          result.runId || request.runId,
          baseData.status,
          baseData.metadata
        ]);
        console.log(`✅ [Background] Saved custom result to database`);
        break;

      case 'emotion_mask':
        await q(`
          INSERT INTO emotion_mask_media (
            user_id, image_url, source_url, prompt, preset, run_id, fal_job_id, status, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          baseData.user_id,
          baseData.image_url,
          baseData.source_url,
          baseData.prompt,
          request.emotionMaskPresetId || 'default',
          baseData.run_id,
          result.runId || request.runId,
          baseData.status,
          baseData.metadata
        ]);
        console.log(`✅ [Background] Saved emotion_mask result to database`);
        break;

      case 'ghibli_reaction':
        await q(`
          INSERT INTO ghibli_reaction_media (
            user_id, image_url, source_url, prompt, preset, run_id, fal_job_id, status, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          baseData.user_id,
          baseData.image_url,
          baseData.source_url,
          baseData.prompt,
          request.ghibliReactionPresetId || 'default',
          baseData.run_id,
          result.runId || request.runId,
          baseData.status,
          baseData.metadata
        ]);
        console.log(`✅ [Background] Saved ghibli_reaction result to database`);
        break;

      case 'story_time':
        // Story time is more complex - it creates a story record and multiple photos
        // For now, just save to video_jobs table
        await q(`
          INSERT INTO video_jobs (
            user_id, type, status, input_data, output_data, progress
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          request.userId,
          'story',
          'completed',
          JSON.stringify({ prompt: request.prompt, sourceAssetId: request.sourceAssetId }),
          JSON.stringify({ videoUrl: result.outputUrl }),
          100
        ]);
        console.log(`✅ [Background] Saved story_time result to database`);
        break;

      default:
        console.warn(`⚠️ [Background] Unknown generation mode: ${request.mode}, skipping database save`);
    }

  } catch (error) {
    console.error(`❌ [Background] Failed to save generation result to database:`, error);
    // Don't throw here - generation was successful, just logging failed
  }
}

// Stability.ai generation with Core-first fallback (Core → SD3 → Ultra)
async function generateWithStability(params: any): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Background] Starting Stability.ai generation`);

  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  
  // Try Stability.ai with 3-tier fallback: Ultra → Core → SD3
  if (STABILITY_API_KEY) {
    const tiers = ["core", "sd3", "ultra"] as const;
    let lastError = null;

    for (const tier of tiers) {
      try {
        console.log(`📤 [Background] Trying Stability.ai ${tier.toUpperCase()}`);
        
        // Special retry logic for ULTRA tier
        let response;
        if (tier === 'ultra') {
          try {
            response = await makeStabilityRequest(tier, params, STABILITY_API_KEY);
          } catch (error) {
            console.warn(`⚠️ [Background] ULTRA failed, retrying once in 1.5s...`, error);
            await new Promise(resolve => setTimeout(resolve, 1500));
            response = await makeStabilityRequest(tier, params, STABILITY_API_KEY);
          }
        } else {
          response = await makeStabilityRequest(tier, params, STABILITY_API_KEY);
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [Background] Stability.ai ${tier} HTTP error:`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`Stability.ai ${tier} failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`🔍 [Background] Stability.ai ${tier} response:`, {
          hasImage: !!result.image,
          imageLength: result.image?.length || 0,
          isBase64: result.image?.startsWith('iVBORw0KGgo') || false,
          fullResponse: result
        });
        
        const base64Image = result.image;
        
        if (base64Image && base64Image.length > 1000) {
          // Stability.ai returns base64 data, upload it to Cloudinary
          const cloudinaryUrl = await uploadBase64ToCloudinary(base64Image);
          
          console.log(`✅ [Background] Success with Stability.ai ${tier.toUpperCase()}`);
          return {
            success: true,
            status: 'done',
            provider: 'stability',
            outputUrl: cloudinaryUrl
          };
        }
        
        console.warn(`⚠️ [Background] No valid image in Stability.ai ${tier} response:`, result);
        throw new Error(`No result from Stability.ai ${tier} - missing image`);
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [Background] Stability.ai ${tier.toUpperCase()} failed:`, error);
        continue; // Try next tier
      }
    }
    
    // All Stability.ai tiers failed
    console.warn(`⚠️ [Background] All Stability.ai tiers failed:`, lastError);
  } else {
    console.warn(`⚠️ [Background] Stability.ai credentials not configured`);
  }
  
  // No Fal fallback when disabled
  throw new Error('All Stability providers failed');
}

// Fal.ai generation with fallback system
async function generateWithFal(mode: GenerationMode, params: any): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Background] Starting Fal.ai generation for mode: ${mode}`);
  
  // Select models based on mode
  let models;
  if (mode === 'presets' || mode === 'custom' || mode === 'emotion_mask') {
    models = PHOTO_MODELS;
  } else if (mode === 'ghibli_reaction') {
    models = GHIBLI_MODELS;
  } else if (mode === 'story_time') {
    models = VIDEO_MODELS;
  } else {
    models = PHOTO_MODELS; // Default fallback
  }

  // Input validation for Fal.ai
  if (!params.sourceAssetId || params.prompt.length < 10) {
    throw new Error("Invalid input for Fal.ai generation: missing source image or prompt too short");
  }
  
  // Validate image_strength for image-to-image models
  const imageStrength = mode === 'ghibli_reaction' ? 0.35 : 0.7;
  if (imageStrength <= 0 || imageStrength > 1) {
    throw new Error("Invalid image_strength for Fal.ai image-to-image generation");
  }

  let lastError: Error | null = null;
  
  for (const modelConfig of models) {
    try {
      console.log(`📤 [Background] Trying ${modelConfig.name} (${modelConfig.model})`);
      
      let result;
      
      if (mode === 'story_time') {
        // Video generation with retry logic
        result = await falInvoke(modelConfig.model, {
          image_url: params.sourceAssetId,
          prompt: params.prompt,
          num_frames: 24,
          fps: 8
        });
        
        const videoUrl = result?.data?.video?.url;
        if (videoUrl) {
          return {
            success: true,
            status: 'done',
            provider: 'fal',
            outputUrl: videoUrl
          };
        }
      } else {
        // Convert Cloudinary signed URL to public URL for Fal.ai
        let processedImageUrl = params.sourceAssetId;
        // Reject blob: URLs early and instruct caller to provide HTTP URL
        if (processedImageUrl && processedImageUrl.startsWith('blob:')) {
          throw new Error(`Invalid sourceAssetId: blob URLs are not accessible by Fal. Please upload and provide an https URL.`);
        }
        if (processedImageUrl && processedImageUrl.includes('cloudinary.com')) {
          // Remove signature parameters from Cloudinary URL to make it publicly accessible
          try {
            const url = new URL(processedImageUrl);
            // Remove authentication parameters
            url.searchParams.delete('signature');
            url.searchParams.delete('api_key');
            url.searchParams.delete('timestamp');
            processedImageUrl = url.toString();
            console.log('🔄 [Fal.ai] Converted signed URL to public URL for Fal.ai');
          } catch (urlError) {
            console.warn('⚠️ [Fal.ai] Failed to parse Cloudinary URL:', urlError);
          }
        }

        // Image generation with single attempt (avoid extra charges on repeated failures)
        // Determine valid steps for model
        const isHyper = isHyperSDXLModel(modelConfig.model);
        const steps = isHyper ? 4 : undefined;

        // Pre-validate steps for Hyper SDXL to avoid 422 charges
        if (isHyper && (steps === undefined || !HYPER_SDXL_ALLOWED_STEPS.has(steps))) {
          throw new Error('Invalid num_inference_steps for Hyper SDXL');
        }

        const input: any = {
          image_url: processedImageUrl,
          prompt: mode === 'ghibli_reaction'
            ? `${params.prompt}, subtle ghibli-inspired lighting, soft dreamy atmosphere, gentle anime influence, preserve original composition`
            : params.prompt,
          image_strength: mode === 'ghibli_reaction' ? 0.35 : 0.7,
          guidance_scale: mode === 'ghibli_reaction' ? 6.0 : 7.5, // Lower guidance for subtler Ghibli effect
          seed: Math.floor(Math.random() * 1000000)
        };
        if (steps !== undefined) {
          input.num_inference_steps = steps;
        }
        
        result = await falInvoke(modelConfig.model, input);
        
        const resultImageUrl = result?.data?.image?.url || result?.image?.url || result?.image_url;
        if (resultImageUrl) {
          // Always upload to Cloudinary before saving/returning
          const cloudinaryUrl = await uploadUrlToCloudinary(resultImageUrl);
          return {
            success: true,
            status: 'done',
            provider: 'fal',
            outputUrl: cloudinaryUrl
          };
        }

        // Explicit handling for PixArt empty results
        if (modelConfig.model === 'fal-ai/pixart-alpha') {
          console.warn('PixArt returned empty result, skipping charge');
        }
      }
      
      throw new Error(`No result from ${modelConfig.name}`);
      
    } catch (error) {
      lastError = error as Error;
      const errorObj = error as any;
      console.warn(`⚠️ [Background] ${modelConfig.name} failed:`, {
        model: modelConfig.model,
        error: errorObj.message || 'Unknown error',
        response: errorObj.response?.data || 'No response data',
        status: errorObj.response?.status || 'No status'
      });
      continue;
    }
  }
  
  throw new Error(`All Fal.ai models failed. Last error: ${lastError?.message}`);
}

// Main generation pipeline
async function processGeneration(request: UnifiedGenerationRequest): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Background] Processing generation:`, {
    mode: request.mode,
    promptLength: request.prompt.length,
    hasSource: !!request.sourceAssetId,
    runId: request.runId
  });

  // Enhanced duplicate prevention - check multiple sources
  try {
    // Check if this runId already exists in any media table (indicating duplicate)
    const tablesToCheck = {
      'neo_glitch': 'neo_glitch_media',
      'presets': 'presets_media',
      'custom': 'custom_prompt_media',
      'emotion_mask': 'emotion_mask_media',
      'ghibli_reaction': 'ghibli_reaction_media',
      'story_time': 'video_jobs'
    };

    const tableName = tablesToCheck[request.mode as keyof typeof tablesToCheck];
    if (tableName) {
      const existing = await qOne(`
        SELECT id FROM ${tableName} WHERE run_id = $1
      `, [request.runId]);

      if (existing) {
        console.warn(`⚠️ [Background] Generation ${request.runId} already exists in database, skipping duplicate`);
        // Refund credits for duplicate attempt
        await finalizeCredits(request.userId, request.mode + '_generation', request.runId, false);
        return {
          success: false,
          status: 'failed',
          error: 'Generation already completed'
        };
      }
    }

    // Also check credits_ledger for recent attempts with same request_id
    const recentCredit = await qOne(`
      SELECT id FROM credits_ledger
      WHERE request_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'
    `, [request.runId]);

    if (recentCredit) {
      console.warn(`⚠️ [Background] Recent credit transaction found for ${request.runId}, possible duplicate`);
      return {
        success: false,
        status: 'failed',
        error: 'Request already processed recently'
      };
    }

  } catch (dbError) {
    console.warn(`⚠️ [Background] Could not check for duplicates:`, dbError);
    // Continue with generation even if duplicate check fails
  }

  // Reserve credits
  const actionMap: Record<GenerationMode, string> = {
    'presets': 'presets_generation',
    'custom': 'custom_prompt_generation',
    'emotion_mask': 'emotion_mask_generation',
    'ghibli_reaction': 'ghibli_reaction_generation',
    'story_time': 'story_time_generate',
    'neo_glitch': 'neo_glitch_generation'
  };

  const action = actionMap[request.mode];
  const creditsNeeded = 2; // All generations cost 2 credits
  
  await reserveCredits(request.userId, action, creditsNeeded, request.runId);

  try {
    let result: UnifiedGenerationResponse;

    // Fal.ai as primary provider, Stability.ai as fallback
    console.log('🚀 [Background] Starting generation with Fal.ai as primary provider');
    
    // Build generation params per mode
    const generationParams = {
      prompt: request.mode === 'ghibli_reaction'
        ? `${request.prompt}, subtle ghibli-inspired lighting, soft dreamy atmosphere, gentle anime influence, preserve original composition`
        : request.prompt,
      sourceAssetId: request.sourceAssetId,
      image_strength: request.mode === 'ghibli_reaction' ? 0.35 : 0.7,
      guidance_scale: request.mode === 'ghibli_reaction' ? 6.0 : 7.5,
      additionalImages: request.additionalImages,
      steps: 30
    };

    try {
      // Try Fal.ai first (primary provider for all modes)
      console.log('🎨 [Background] Attempting generation with Fal.ai');
      result = await generateWithFal(request.mode, generationParams);
      console.log('✅ [Background] Fal.ai generation successful');
    } catch (falError) {
      console.warn('⚠️ [Background] Fal.ai failed, falling back to Stability.ai:', falError);
      
      // Fallback to Stability.ai (not available for video/story_time)
      if (request.mode === 'story_time') {
        console.error('❌ [Background] Story Time requires Fal.ai (video generation)');
        throw new Error(`Video generation failed: ${falError}`);
      }
      
      try {
        // Try Stability.ai as fallback for image modes
        console.log('🎨 [Background] Attempting fallback with Stability.ai');
        result = await generateWithStability(generationParams);
        console.log('✅ [Background] Stability.ai fallback successful');
      } catch (stabilityError) {
        console.error('❌ [Background] Both Fal.ai and Stability.ai failed');
        throw new Error(`All providers failed. Fal: ${falError}. Stability: ${stabilityError}`);
      }
    }

        // Save result to database based on mode
    await saveGenerationResult(request, result);

    // Generation will be saved to appropriate media table by saveGenerationResult()

    // Finalize credits on success
    await finalizeCredits(request.userId, action, request.runId, true);

    console.log(`✅ [Background] Generation completed successfully:`, {
      mode: request.mode,
      provider: result.provider,
      hasOutput: !!result.outputUrl
    });

    return result;

  } catch (error) {
    console.error(`❌ [Background] Generation failed:`, error);

    // Error will be logged but generation status is tracked in credits_ledger

    // Finalize credits on failure (refund)
    await finalizeCredits(request.userId, action, request.runId, false);

    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main handler
const handler: Handler = async (event, context) => {
  console.log(`🚀 [Background] Starting unified generation background function`);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_JSON_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_JSON_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { mode, prompt, sourceAssetId, userId, presetKey, emotionMaskPresetId, storyTimePresetId, additionalImages, meta } = body;

    // Validate required fields
    if (!mode || !prompt || !sourceAssetId || !userId) {
      return {
        statusCode: 400,
        headers: CORS_JSON_HEADERS,
        body: JSON.stringify({ 
          success: false,
          status: 'failed',
          error: 'Missing required fields: mode, prompt, sourceAssetId, userId' 
        })
      };
    }

    // Generate unique run ID
    const runId = uuidv4();

    // Create generation request
    const generationRequest: UnifiedGenerationRequest = {
      mode,
      prompt,
      presetKey,
      sourceAssetId,
      userId,
      runId: runId, // Ensure runId is always defined
      emotionMaskPresetId,
      storyTimePresetId,
      additionalImages,
      meta
    };

    // Process generation with timeout protection (10 minutes)
    const result = await Promise.race([
      processGeneration(generationRequest),
      new Promise<UnifiedGenerationResponse>((_, reject) =>
        setTimeout(() => reject(new Error('Generation timed out after 10 minutes')), 10 * 60 * 1000) // 10 minutes
      )
    ]);

    return {
      statusCode: 200,
      headers: CORS_JSON_HEADERS,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('💥 [Background] Handler error:', error);
    
    return {
      statusCode: 500,
      headers: CORS_JSON_HEADERS,
      body: JSON.stringify({
        success: false,
        status: error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler };
