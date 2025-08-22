import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

interface IdentitySafeGenerationRequest {
  prompt: string;
  imageUrl: string;
  strength?: number;
  guidance?: number;
  mode?: 'identity-safe' | 'neo-tokyo-glitch' | 'check-status';
}

interface NeoTokyoGlitchRequest {
  imageUrl: string;
  preset?: 'base' | 'visor' | 'tattoos' | 'scanlines';
  customPrompt?: string;
}

interface StatusCheckRequest {
  predictionId: string;
  retryCount?: number;
  originalRequest?: NeoTokyoGlitchRequest;
}

interface ReplicatePredictionResponse {
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get?: string;
    cancel?: string;
  };
}

interface IdentitySafeGenerationResponse {
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get?: string;
    cancel?: string;
  };
  message: string;
}

// Neo Tokyo Glitch presets with enhanced prompts and NSFW-safe parameters
const NEO_TOKYO_GLITCH_PRESETS = {
  base: {
    prompt: "Transform into a corrupted Neo Tokyo avatar. Cel-shaded glitch face, dominant glowing tattoos in vibrant neon magenta/cyan, intense scanlines and CRT noise. Face overlays: holographic UI, glitch masks, flicker effects. Apply digital tearing, VHS-style distortions, neon bloom, techno-chaos. Colors must pop: high-contrast magenta, cyan, blue, purple, black backdrop. Inspired by Akira + Ghost in the Shell",
    negative_prompt: "deformed, mutated, cropped face, low resolution, distorted eyes, extra limbs, blur, realistic skin, photorealistic, nudity, sexual content, adult content, inappropriate",
    strength: 0.45,
    guidance_scale: 7.5
  },
  visor: {
    prompt: "Transform into a corrupted Neo Tokyo avatar. Cel-shaded glitch face, PROMINENT glowing magenta or cyan glitch visor over eyes, intense scanlines and CRT noise. Face overlays: holographic UI, glitch masks, flicker effects. Apply digital tearing, VHS-style distortions, neon bloom, techno-chaos. Colors must pop: high-contrast magenta, cyan, blue, purple, black backdrop. Inspired by Akira + Ghost in the Shell",
    negative_prompt: "deformed, mutated, cropped face, low resolution, distorted eyes, extra limbs, blur, realistic skin, photorealistic, small visor, nudity, sexual content, adult content, inappropriate",
    strength: 0.45,
    guidance_scale: 7.5
  },
  tattoos: {
    prompt: "Transform into a corrupted Neo Tokyo avatar. Cel-shaded glitch face, PROMINENT glowing magenta or cyan cyber tattoos covering face and neck, intense scanlines and CRT noise. Face overlays: holographic UI, glitch masks, flicker effects. Apply digital tearing, VHS-style distortions, neon bloom, techno-chaos. Colors must pop: high-contrast magenta, cyan, blue, purple, black backdrop. Inspired by Akira + Ghost in the Shell",
    negative_prompt: "deformed, mutated, cropped face, low resolution, distorted eyes, extra limbs, blur, realistic skin, photorealistic, small tattoos, nudity, sexual content, adult content, inappropriate",
    strength: 0.45,
    guidance_scale: 7.5
  },
  scanlines: {
    prompt: "Transform into a corrupted Neo Tokyo avatar. Cel-shaded glitch face, INTENSE scanlines and VHS noise, intense scanlines and CRT noise. Face overlays: holographic UI, glitch masks, flicker effects. Apply digital tearing, VHS-style distortions, neon bloom, techno-chaos. Colors must pop: high-contrast magenta, cyan, blue, purple, black backdrop. Inspired by Akira + Ghost in the Shell",
    negative_prompt: "deformed, mutated, cropped face, low resolution, distorted eyes, extra limbs, blur, realistic skin, photorealistic, clean image, nudity, sexual content, adult content, inappropriate",
    strength: 0.45,
    guidance_scale: 7.5
  }
};

const handler: Handler = async (event) => {
  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  try {
    console.log('🧠 Main handler entered');
    console.log('📡 HTTP method:', event.httpMethod);
    console.log('📦 Request body length:', event.body?.length || 0);
    
    const body = JSON.parse(event.body || '{}');
    console.log('🔍 Parsed body:', JSON.stringify(body, null, 2));
    
    // Check if this is a status check request
    if (body.mode === 'check-status') {
      console.log('🔍 Status check mode detected');
      return await handleStatusCheck(body, headers);
    }
    
    // Check if this is a Neo Tokyo Glitch request
    if (body.mode === 'neo-tokyo-glitch') {
      console.log('🎭 Neo Tokyo Glitch mode detected');
      return await handleNeoTokyoGlitch(body, headers);
    }
    
    console.log('🆔 Identity-safe generation mode detected');
    // Default identity-safe generation
    return await handleIdentitySafeGeneration(body, headers);

  } catch (err) {
    const error = err as Error;
    console.error('💥 Generation error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Unknown error occurred during generation',
        timestamp: new Date().toISOString()
      }),
    };
  }
};

async function handleNeoTokyoGlitch(body: NeoTokyoGlitchRequest, headers: any) {
  return await handleNeoTokyoGlitchWithRetry(body, headers, 0);
}

async function handleNeoTokyoGlitchWithRetry(body: NeoTokyoGlitchRequest, headers: any, retryCount: number) {
  console.log('🧠 Entered Neo Tokyo Glitch handler');
  console.log('📦 Request body:', JSON.stringify(body, null, 2));
  
  const { imageUrl, preset = 'base', customPrompt } = body;

  console.log('🔍 Parsed parameters:', { imageUrl: imageUrl?.substring(0, 100), preset, customPrompt: !!customPrompt });

  // Validate required parameters
  if (!imageUrl) {
    console.log('❌ Missing imageUrl parameter');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Missing required parameter: imageUrl is required' 
      }),
    };
  }

  // Validate Replicate API key
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN environment variable not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Replicate API not configured' }),
    };
  }

  const presetConfig = NEO_TOKYO_GLITCH_PRESETS[preset];
  const prompt = customPrompt || presetConfig.prompt;
  const negativePrompt = presetConfig.negative_prompt;

  console.log('🔧 Preset configuration:', {
    preset,
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    negativePrompt: negativePrompt.substring(0, 100) + (negativePrompt.length > 100 ? '...' : ''),
    strength: presetConfig.strength,
    guidance_scale: presetConfig.guidance_scale
  });

  console.log('🚀 Starting Neo Tokyo Glitch generation:', {
    preset,
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    imageUrl: imageUrl.substring(0, 100) + '...',
    strength: presetConfig.strength,
    guidance_scale: presetConfig.guidance_scale,
    timestamp: new Date().toISOString()
  });

  console.log('🔑 API Key check:', {
    hasApiKey: !!process.env.REPLICATE_API_TOKEN,
    apiKeyLength: process.env.REPLICATE_API_TOKEN?.length || 0,
    apiKeyPrefix: process.env.REPLICATE_API_TOKEN?.substring(0, 10) + '...' || 'none'
  });

  console.log('⚡ Calling Replicate img2img for Neo Tokyo Glitch');
  console.log('🌐 Replicate endpoint: https://api.replicate.com/v1/predictions');
  console.log('📤 Request payload:', JSON.stringify({
    version: "a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5",
    input: {
      image: imageUrl.substring(0, 100) + '...',
      prompt: prompt.substring(0, 100) + '...',
      negative_prompt: negativePrompt.substring(0, 100) + '...',
      strength: presetConfig.strength,
      num_outputs: 1,
      scheduler: 'K_EULER_ANCESTRAL',
      guidance_scale: presetConfig.guidance_scale,
      num_inference_steps: 50,
      seed: 'random'
    }
  }, null, 2));

  // Call Replicate API for Neo Tokyo Glitch generation
  const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
          body: JSON.stringify({
        version: "a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5", // stability-ai/stable-diffusion-img2img
        input: {
          image: imageUrl,
          prompt: prompt,
          negative_prompt: negativePrompt,
          strength: presetConfig.strength,
          num_outputs: 1,
          scheduler: 'K_EULER_ANCESTRAL',
          guidance_scale: presetConfig.guidance_scale,
          num_inference_steps: 40,
          seed: Math.floor(Math.random() * 1000000), // Random seed for variety
        }
      }),
  });

  if (!replicateRes.ok) {
    const error = await replicateRes.json().catch(() => ({}));
    console.error('❌ Neo Tokyo Glitch Replicate API error:', {
      status: replicateRes.status,
      statusText: replicateRes.statusText,
      error: error?.detail || error?.error || 'Unknown error'
    });
    
    return {
      statusCode: replicateRes.status,
      headers,
      body: JSON.stringify({ 
        error: error?.detail || error?.error || replicateRes.statusText,
        status: replicateRes.status
      })
    };
  }

  const replicateData: ReplicatePredictionResponse = await replicateRes.json();
  
  console.log('✅ Neo Tokyo Glitch generation started successfully:', {
    predictionId: replicateData.id,
    status: replicateData.status,
    createdAt: replicateData.created_at,
    preset
  });

  const response: IdentitySafeGenerationResponse = {
    id: replicateData.id,
    status: replicateData.status,
    created_at: replicateData.created_at,
    urls: replicateData.urls,
    message: `Neo Tokyo Glitch (${preset}) generation started successfully`
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response),
  };
}

async function handleIdentitySafeGeneration(body: IdentitySafeGenerationRequest, headers: any) {
  const { prompt, imageUrl, strength = 0.7, guidance = 7.5 } = body;

  // Validate required parameters
  if (!prompt || !imageUrl) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Missing required parameters: prompt and imageUrl are required' 
      }),
    };
  }

  // Validate Replicate API key
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN environment variable not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Replicate API not configured' }),
    };
  }

  console.log('🚀 Starting identity-safe generation:', {
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    imageUrl: imageUrl.substring(0, 100) + '...',
    strength,
    guidance,
    timestamp: new Date().toISOString()
  });

  // Call Replicate API for identity-safe generation
  const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
          body: JSON.stringify({
        version: "84f1bfa5a264ae8a4b9c77385b32f6b8bb717cdafdd6e21d30592b9b44da6a60", // zsxkib/infinite-you:sim_stage1
        input: {
          image: imageUrl,
          prompt: prompt,
          strength: strength,
          guidance_scale: guidance,
          num_inference_steps: 40,
          seed: Math.floor(Math.random() * 1000000), // Random seed for variety
        }
      }),
  });

  if (!replicateRes.ok) {
    const error = await replicateRes.json().catch(() => ({}));
    console.error('❌ Replicate API error:', {
      status: replicateRes.status,
      statusText: replicateRes.statusText,
      error: error?.detail || error?.error || 'Unknown error'
    });
    
    return {
      statusCode: replicateRes.status,
      headers,
      body: JSON.stringify({ 
        error: error?.detail || error?.error || replicateRes.statusText,
        status: replicateRes.status
      })
    };
  }

  const replicateData: ReplicatePredictionResponse = await replicateRes.json();
  
  console.log('✅ Identity-safe generation started successfully:', {
    predictionId: replicateData.id,
    status: replicateData.status,
    createdAt: replicateData.created_at
  });

  const response: IdentitySafeGenerationResponse = {
    id: replicateData.id,
    status: replicateData.status,
    created_at: replicateData.created_at,
    urls: replicateData.urls,
    message: 'Identity-safe generation started successfully'
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response),
  };
}

async function handleStatusCheck(body: StatusCheckRequest, headers: any) {
  console.log('🧠 Entered status check handler');
  console.log('📦 Request body:', JSON.stringify(body, null, 2));
  
  const { predictionId } = body;

  console.log('🔍 Parsed parameters:', { predictionId });

  // Validate required parameters
  if (!predictionId) {
    console.log('❌ Missing predictionId parameter');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Missing required parameter: predictionId is required' 
      }),
    };
  }

  // Validate Replicate API key
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN environment variable not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Replicate API not configured' }),
    };
  }

  console.log('🔍 Checking Replicate prediction status:', predictionId);

  try {
    // Call Replicate's status endpoint
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ Replicate status check error:', {
        status: response.status,
        statusText: response.statusText,
        error: error?.detail || error?.error || 'Unknown error'
      });
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: error?.detail || error?.error || response.statusText,
          status: response.status
        })
      };
    }

    const data = await response.json();
    
    console.log('✅ Status check successful:', {
      predictionId: data.id,
      status: data.status,
      hasOutput: !!data.output,
      outputCount: data.output?.length || 0,
      error: data.error,
      logs: data.logs
    });

    // Handle NSFW failure with retry
    if (data.status === 'failed' && data.error && data.error.includes('NSFW') && body.retryCount === 0 && body.originalRequest) {
      console.log('🚨 NSFW content detected, retrying with adjusted parameters...');
      
      // Retry with lower guidance scale and more conservative prompt
      const retryRequest = {
        ...body.originalRequest,
        customPrompt: body.originalRequest.customPrompt || 
          "Transform into a Neo Tokyo cyberpunk character. Cel-shaded face, subtle neon accents, digital glitch effects, urban background. Keep it clean and artistic."
      };
      
      return await handleNeoTokyoGlitchWithRetry(retryRequest, headers, 1);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: data.id,
        status: data.status,
        output: data.output,
        error: data.error,
        logs: data.logs
      }),
    };

  } catch (error) {
    console.error('💥 Status check failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to check prediction status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

export { handler };
