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
import { fal } from '@fal-ai/client';
import { q, qOne } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { withAuth } from './_withAuth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
});

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
  emotionMaskPresetId?: string;
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
    model: 'fal-ai/stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    cost: 'high',
    priority: 2,
    description: 'Premium photo-realistic generation'
  },
  {
    model: 'fal-ai/realistic-vision-v5',
    name: 'Realistic Vision V5',
    cost: 'high',
    priority: 3,
    description: 'Ultra-realistic photo generation'
  }
];

const GHIBLI_MODELS = [
  {
    model: 'fal-ai/ghiblify',
    name: 'Ghiblify',
    cost: 'low',
    priority: 1,
    description: 'Studio Ghibli style transformations'
  },
  {
    model: 'fal-ai/hyper-sdxl/image-to-image',
    name: 'Hyper SDXL I2I',
    cost: 'medium',
    priority: 2,
    description: 'High-quality image-to-image with Ghibli style'
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
  form.append("prompt", `${params.prompt}, neo tokyo glitch style, cyberpunk aesthetic`);
  form.append("init_image", params.sourceAssetId);
  form.append("image_strength", "0.35");
  form.append("steps", "30");
  form.append("cfg_scale", "7.5");
  form.append("samples", "1");

  return fetch(MODEL_ENDPOINTS[tier as keyof typeof MODEL_ENDPOINTS], {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    body: form,
    signal: AbortSignal.timeout(180000) // 3 minutes timeout
  });
}

// Cloudinary upload helper
async function uploadBase64ToCloudinary(base64Data: string): Promise<string> {
  try {
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'generated.png');
    formData.append('upload_preset', 'ml_default');
    
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult.secure_url;
  } catch (error: any) {
    console.error('❌ [Background] Cloudinary upload error:', error);
    throw error;
  }
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

// Stability.ai generation with 3-tier fallback
async function generateWithStability(params: any): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Background] Starting Stability.ai generation for Neo Tokyo Glitch`);
  
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  
  // Try Stability.ai with 3-tier fallback: Ultra → Core → SD3
  if (STABILITY_API_KEY) {
    const tiers = ["ultra", "core", "sd3"] as const;
    let lastError = null;

    for (const tier of tiers) {
      try {
        console.log(`📤 [Background] Trying Stability.ai ${tier.toUpperCase()} for Neo Tokyo Glitch`);
        
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
          hasArtifacts: !!result.artifacts,
          artifactsCount: result.artifacts?.length || 0,
          firstArtifact: result.artifacts?.[0] ? {
            hasUrl: !!result.artifacts[0].url,
            urlLength: result.artifacts[0].url?.length || 0
          } : null,
          fullResponse: result
        });
        
        const imageUrl = result.artifacts?.[0]?.url;
        
        if (imageUrl) {
          // Download the image and upload to Cloudinary
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Data = Buffer.from(imageBuffer).toString('base64');
          const cloudinaryUrl = await uploadBase64ToCloudinary(base64Data);
          
          console.log(`✅ [Background] Success with Stability.ai ${tier.toUpperCase()}`);
          return {
            success: true,
            status: 'done',
            provider: 'stability',
            outputUrl: cloudinaryUrl
          };
        }
        
        console.warn(`⚠️ [Background] No valid image URL in Stability.ai ${tier} response:`, result);
        throw new Error(`No result from Stability.ai ${tier} - missing image URL`);
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [Background] Stability.ai ${tier.toUpperCase()} failed:`, error);
        continue; // Try next tier
      }
    }
    
    // All Stability.ai tiers failed
    console.warn(`⚠️ [Background] All Stability.ai tiers failed, falling back to Fal.ai:`, lastError);
  } else {
    console.warn(`⚠️ [Background] Stability.ai credentials not configured, using Fal.ai fallback`);
  }
  
  // Fallback to Fal.ai for Neo Tokyo Glitch
  console.log(`📤 [Background] Using Fal.ai fallback for Neo Tokyo Glitch`);
  return await generateWithFal('neo_glitch', params);
}

// Fal.ai generation with fallback system
async function generateWithFal(mode: GenerationMode, params: any): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Background] Starting Fal.ai generation for mode: ${mode}`);
  
  let models = PHOTO_MODELS;
  if (mode === 'ghibli_reaction') {
    models = GHIBLI_MODELS;
  } else if (mode === 'story_time') {
    models = VIDEO_MODELS;
  }

  let lastError: Error | null = null;
  
  for (const modelConfig of models) {
    try {
      console.log(`📤 [Background] Trying ${modelConfig.name} (${modelConfig.model})`);
      
      let result;
      
      if (mode === 'story_time') {
        // Video generation with retry logic
        try {
          result = await fal.subscribe(modelConfig.model, {
            input: {
              image_url: params.sourceAssetId,
              prompt: params.prompt,
              num_frames: 24,
              fps: 8
            },
            logs: true
          });
        } catch (error) {
          console.warn(`⚠️ [Background] ${modelConfig.name} video generation failed, retrying in 2s...`, error);
          await new Promise(resolve => setTimeout(resolve, 2000));
          result = await fal.subscribe(modelConfig.model, {
            input: {
              image_url: params.sourceAssetId,
              prompt: params.prompt,
              num_frames: 24,
              fps: 8
            },
            logs: true
          });
        }
        
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
        // Image generation with retry logic
        const input: any = {
          image_url: params.sourceAssetId,
          prompt: params.prompt,
          image_strength: mode === 'ghibli_reaction' ? 0.35 : 0.7,
          guidance_scale: 7.5,
          num_inference_steps: 30,
          seed: Math.floor(Math.random() * 1000000)
        };
        
        try {
          result = await fal.subscribe(modelConfig.model, {
            input,
            logs: true
          });
        } catch (error) {
          console.warn(`⚠️ [Background] ${modelConfig.name} failed, retrying in 2s...`, error);
          await new Promise(resolve => setTimeout(resolve, 2000));
          result = await fal.subscribe(modelConfig.model, {
            input,
            logs: true
          });
        }
        
        const imageUrl = result?.data?.image?.url;
        if (imageUrl) {
          return {
            success: true,
            status: 'done',
            provider: 'fal',
            outputUrl: imageUrl
          };
        }
      }
      
      throw new Error(`No result from ${modelConfig.name}`);
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ [Background] ${modelConfig.name} failed:`, error);
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

    if (request.mode === 'neo_glitch') {
      result = await generateWithStability(request);
    } else {
      result = await generateWithFal(request.mode, request);
    }

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
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS' 
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'POST, OPTIONS' 
      },
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
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Content-Type': 'application/json' 
        },
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
      emotionMaskPresetId,
      storyTimePresetId,
      additionalImages,
      meta
    };

    // Process generation with timeout protection
    const result = await Promise.race([
      processGeneration(generationRequest),
      new Promise<UnifiedGenerationResponse>((_, reject) => 
        setTimeout(() => reject(new Error('Generation exceeded allowed time')), 600000) // 10 minutes
      )
    ]);

    // Add runId to response
    result.runId = runId;

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('💥 [Background] Handler error:', error);
    
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        success: false,
        status: error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

export { handler };
