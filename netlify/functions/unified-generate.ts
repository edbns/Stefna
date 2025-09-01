// netlify/functions/unified-generate.ts
// Unified Generation Handler - Consolidated Logic for All Generation Modes
// 
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use Fal.ai for 5 modes (Presets, Custom, Emotion Mask, Ghibli, Story Time)
// 2. SECONDARY: Use Stability.ai for Neo Tokyo Glitch
// 3. FALLBACK: Cross-provider fallbacks for reliability
// 4. CREDITS: Centralized credit handling for all modes
// 
// ⚠️ IMPORTANT: This replaces all individual generation functions with true consolidation

import { Handler } from '@netlify/functions';
import { fal } from '@fal-ai/client';
import { q, qOne, qCount } from './_db';
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
  runId: string;
  emotionMaskPresetId?: string;
  storyTimePresetId?: string;
  additionalImages?: string[];
  meta?: any;
}

interface UnifiedGenerationResponse {
  success: boolean;
  status: 'completed' | 'processing' | 'failed';
  jobId?: string;
  runId?: string;
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
  provider?: string;
  falJobId?: string;
  stabilityJobId?: string;
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
    description: 'High-quality anime-style generation'
  }
];

const VIDEO_MODELS = [
  {
    model: 'fal-ai/stable-video-diffusion',
    name: 'Stable Video Diffusion',
    cost: 'medium',
    priority: 1,
    description: 'High-quality video generation from images'
  },
  {
    model: 'fal-ai/fast-sdxl',
    name: 'Fast SDXL Video',
    cost: 'low',
    priority: 2,
    description: 'Fast video generation from images'
  }
];

// Stability.ai models for Neo Tokyo Glitch
// Note: Uses Stability.ai as primary, Fal.ai as fallback

// Centralized credit handling - direct database operations
async function reserveCredits(userId: string, action: string, creditsNeeded: number, requestId: string): Promise<boolean> {
  try {
    console.log(`💰 [Unified] Reserving ${creditsNeeded} credits for ${action}`);
    
    // Check user's current credit balance
    const userCredits = await qOne(`
      SELECT user_id, credits, balance FROM user_credits WHERE user_id = $1
    `, [userId]);

    if (!userCredits) {
      // Initialize user credits if they don't exist
      console.log('💰 [Unified] No credit balance found - initializing new user with starter credits...');
      
      const newUserCredits = await qOne(`
        INSERT INTO user_credits (user_id, credits, balance, updated_at)
        VALUES ($1, 30, 0, NOW())
        RETURNING user_id, credits, balance
      `, [userId]);
      
      if (!newUserCredits) {
        throw new Error('Failed to initialize user credits');
      }
      
      console.log(`✅ [Unified] Successfully initialized user with 30 starter credits`);
    }

    const currentCredits = userCredits?.credits || 0;
    console.log(`💰 [Unified] Current daily credits: ${currentCredits}, needed: ${creditsNeeded}`);

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

    console.log(`✅ [Unified] Credits reserved successfully`);
    return true;
  } catch (error) {
    console.error(`❌ [Unified] Credit reservation failed:`, error);
    throw error;
  }
}

async function finalizeCredits(userId: string, action: string, requestId: string, success: boolean): Promise<void> {
  try {
    console.log(`💰 [Unified] Finalizing credits for ${action}, success: ${success}`);
    
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

    console.log(`✅ [Unified] Credits finalized successfully`);
  } catch (error) {
    console.error(`❌ [Unified] Credit finalization failed:`, error);
  }
}

// Fal.ai generation with fallback system
async function generateWithFal(mode: GenerationMode, params: any): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Unified] Starting Fal.ai generation for mode: ${mode}`);
  
  let models = PHOTO_MODELS;
  if (mode === 'ghibli_reaction') {
    models = GHIBLI_MODELS;
  } else if (mode === 'story_time') {
    models = VIDEO_MODELS;
  }

  let lastError: Error | null = null;
  
  for (const modelConfig of models) {
    try {
      console.log(`📤 [Unified] Trying ${modelConfig.name} (${modelConfig.model})`);
      
      let result;
      
      if (mode === 'story_time') {
        // Video generation with retry logic
        let result;
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
          console.warn(`⚠️ [Unified] ${modelConfig.name} video generation failed, retrying in 2s...`, error);
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
            status: 'completed',
            jobId: params.runId,
            runId: params.runId,
            videoUrl,
            provider: 'fal',
            falJobId: `${modelConfig.model}_${params.runId}`
          };
        }
      } else {
        // Image generation
        const input: any = {
          image_url: params.sourceAssetId,
          prompt: params.prompt,
          image_strength: mode === 'ghibli_reaction' ? 0.35 : 0.7,
          guidance_scale: 7.5,
          num_inference_steps: 30,
          seed: Math.floor(Math.random() * 1000000)
        };
        
        // Add retry logic for Fal.ai
        let result;
        try {
          result = await fal.subscribe(modelConfig.model, {
            input,
            logs: true
          });
        } catch (error) {
          console.warn(`⚠️ [Unified] ${modelConfig.name} failed, retrying in 2s...`, error);
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
            status: 'completed',
            jobId: params.runId,
            runId: params.runId,
            imageUrl,
            provider: 'fal',
            falJobId: `${modelConfig.model}_${params.runId}`
          };
        }
      }
      
      throw new Error(`No result from ${modelConfig.name}`);
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ [Unified] ${modelConfig.name} failed:`, error);
      continue;
    }
  }
  
  throw new Error(`All Fal.ai models failed. Last error: ${lastError?.message}`);
}

// Stability.ai generation for Neo Tokyo Glitch (with Fal.ai fallback)
async function generateWithStability(params: any): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Unified] Starting Stability.ai generation for Neo Tokyo Glitch`);
  
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
  const STABILITY_API_URL = process.env.STABILITY_API_URL;
  
  // Try Stability.ai with 3-tier fallback: Ultra → Core → SD3
  if (STABILITY_API_KEY) {
    const MODEL_ENDPOINTS = {
      ultra: "https://api.stability.ai/v2beta/stable-image/generate/ultra",
      core: "https://api.stability.ai/v2beta/stable-image/generate/core", 
      sd3: "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    };

    const tiers: Array<keyof typeof MODEL_ENDPOINTS> = ["ultra", "core", "sd3"];
    let lastError = null;

    for (const tier of tiers) {
      try {
        console.log(`📤 [Unified] Trying Stability.ai ${tier.toUpperCase()} for Neo Tokyo Glitch`);
        
        const form = new FormData();
        form.append("prompt", `${params.prompt}, neo tokyo glitch style, cyberpunk aesthetic`);
        form.append("init_image", params.sourceAssetId);
        form.append("image_strength", "0.35");
        form.append("steps", "30");
        form.append("cfg_scale", "7.5");
        form.append("samples", "1");

        const response = await fetch(MODEL_ENDPOINTS[tier], {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'Accept': 'application/json',
          },
          body: form,
          signal: AbortSignal.timeout(180000) // 3 minutes timeout
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Stability.ai ${tier} failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        const imageUrl = result.artifacts?.[0]?.url;
        
        if (imageUrl) {
          // Download the image and upload to Cloudinary
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Data = Buffer.from(imageBuffer).toString('base64');
          const cloudinaryUrl = await uploadBase64ToCloudinary(base64Data);
          
          console.log(`✅ [Unified] Success with Stability.ai ${tier.toUpperCase()}`);
          return {
            success: true,
            status: 'completed',
            jobId: params.runId,
            runId: params.runId,
            imageUrl: cloudinaryUrl,
            provider: 'stability',
            stabilityJobId: `stability_${tier}_${params.runId}`
          };
        }
        
        throw new Error(`No result from Stability.ai ${tier}`);
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [Unified] Stability.ai ${tier.toUpperCase()} failed:`, error);
        continue; // Try next tier
      }
    }
    
    // All Stability.ai tiers failed
    console.warn(`⚠️ [Unified] All Stability.ai tiers failed, falling back to Fal.ai:`, lastError);
  } else {
    console.warn(`⚠️ [Unified] Stability.ai credentials not configured, using Fal.ai fallback`);
  }
  
  // Fallback to Fal.ai for Neo Tokyo Glitch
  console.log(`📤 [Unified] Using Fal.ai fallback for Neo Tokyo Glitch`);
  return await generateWithFal('neo_glitch', params);
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
    console.error('❌ [Unified] Cloudinary upload error:', error);
    throw error;
  }
}

// Main generation function
async function processGeneration(request: UnifiedGenerationRequest): Promise<UnifiedGenerationResponse> {
  console.log(`🚀 [Unified] Processing generation:`, {
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
    
    console.log(`✅ [Unified] Generation completed successfully:`, {
      mode: request.mode,
      provider: result.provider,
      hasImage: !!result.imageUrl,
      hasVideo: !!result.videoUrl
    });

    return result;

  } catch (error) {
    console.error(`❌ [Unified] Generation failed:`, error);
    
    // Finalize credits on failure (refund)
    await finalizeCredits(request.userId, action, request.runId, false);
    
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Check generation status
async function checkGenerationStatus(jobId: string, mode: GenerationMode): Promise<UnifiedGenerationResponse> {
  console.log(`🔍 [Unified] Checking status for job: ${jobId}, mode: ${mode}`);
  
  // For now, return a simple status check
  // In a real implementation, you'd query the database or check the provider's status
  return {
    success: true,
    status: 'completed',
    jobId,
    provider: mode === 'neo_glitch' ? 'stability' : 'fal'
  };
}

export const handler: Handler = withAuth(async (event, context) => {
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

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle GET requests for status checking
  if (event.httpMethod === 'GET') {
    const jobId = event.queryStringParameters?.jobId;
    const mode = event.queryStringParameters?.mode as GenerationMode;
    
    if (!jobId || !mode) {
      return {
        statusCode: 400,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'jobId and mode parameters required' })
      };
    }

    try {
      const status = await checkGenerationStatus(jobId, mode);
      
      return {
        statusCode: 200,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify(status)
      };
    } catch (error) {
      console.error('❌ [Unified] Status check failed:', error);
      return {
        statusCode: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ 
          error: 'Status check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }

  // Handle POST requests for generation
  try {
    const request: UnifiedGenerationRequest = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!request.mode || !request.prompt || !request.userId || !request.runId) {
      return {
        statusCode: 400,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: mode, prompt, userId, runId' 
        })
      };
    }

    console.log('🚀 [Unified] Starting generation:', {
      mode: request.mode,
      promptLength: request.prompt.length,
      hasSource: !!request.sourceAssetId,
      runId: request.runId
    });

    // Process generation
    const result = await processGeneration(request);
    
    console.log('✅ [Unified] Generation result:', {
      success: result.success,
      status: result.status,
      provider: result.provider
    });

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ [Unified] Generation failed:', error);
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
      },
      body: JSON.stringify({ 
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
});
