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

// Neo Tokyo Glitch presets with identity-preserving prompts and optimized parameters
const NEO_TOKYO_GLITCH_PRESETS = {
  base: {
    prompt: `Stylized cyberpunk portrait inspired by Neo Tokyo aesthetics. 
Retain facial identity and beauty. Face must match the subject image. Keep symmetry, skin tone, and gender. Subject must be clearly recognizable. Stylize only with overlays and lighting, not by changing facial structure.

Use cel-shaded anime detail and high-fashion sci-fi energy. Add glowing holographic elements, glitch FX, particle trails, and neon shimmer.
Stylize with soft glitch effects, digital particles, and cyberpunk background. Keep lighting dramatic but not overpowering. Use ambient reflections and subtle neon shimmer.

Background: vertical city lights, violet haze, soft scanlines. 
Color palette: electric pink, cyan, sapphire blue, ultraviolet, black. 
Inspired by Akira, Ghost in the Shell, and glitch fashion photography.`,
    negative_prompt: `blurry, distorted face, ugly, deformed, bad anatomy, extra limbs, photorealism, dull style, low contrast, 
nudity, cleavage, gender change, ethnicity change, identity change, merged face, artifacts, realistic texture, boring lighting`,
    strength: 0.45,
    guidance_scale: 7.5
  },
  visor: {
    prompt: `Stylized cyberpunk portrait with a PROMINENT glowing glitch visor covering the eyes. 
Add flickering holographic UI overlays and digital reflection in the visor. 
Retain identity and beauty: symmetrical face, elegant structure, intense glowing eyes. 
Use neon glitch bloom, chromatic aberration, and techno-chaotic lighting.
Background: animated signs, deep contrast, vertical noise.
Color theme: magenta visor glow, cyan-blue reflections, violet haze, black backdrop.
Inspired by cyberpunk anime and digital fashion.`,
    negative_prompt: `small visor, invisible visor, blurry, distorted eyes, mutated face, gender change, identity change, 
nudity, dull colors, flat lighting, weak glitch effects, minimal transformation`,
    strength: 0.45,
    guidance_scale: 8.0
  },
  tattoos: {
    prompt: `Stylized cyberpunk portrait with glowing cyber tattoos. 
Retain facial identity and beauty. Face must match the subject image. Keep symmetry, skin tone, and gender. Subject must be clearly recognizable. Stylize only with overlays and lighting, not by changing facial structure.

Add glowing cyan and magenta cyber tattoos over face and neck, designed as holographic circuits. Tattoos should be layered, not replace the face. Face must remain unchanged - overlay tattoos while preserving natural facial features. Enhance with glowing facial circuit patterns while keeping core identity.

Add glitch overlays, datamosh FX, and soft neon ambient lighting. 
Background: chaotic digital Tokyo, broken signage, animated overlays.
Color theme: glowing tattoos, pink/blue/cyan/neon blend with dark backdrop.`,
    negative_prompt: `small tattoos, faint markings, weak glow, blurry face, identity distortion, merged features, 
nudity, photorealism, boring style, unflattering, bad anatomy, pose change, ethnicity change, gender change`,
    strength: 0.48,
    guidance_scale: 8.5
  },
  scanlines: {
    prompt: `Stylized cyberpunk portrait with CRT scanline effects. 
Retain facial identity and beauty. Face must match the subject image. Keep symmetry, skin tone, and gender. Subject must be clearly recognizable. Stylize only with overlays and lighting, not by changing facial structure.

Overlay intense CRT scanlines and VHS noise. Simulate broken holographic monitor interface over the background. Use high-contrast neon hues. Keep face sharp, expressive, symmetrical, and identity-locked. Add cel-shaded highlights, neon reflections, and subtle chromatic aberration on skin edges.

Background: corrupted cityscape viewed through broken CRT monitor. 
Color palette: high-contrast glitch colors — pink, cyan, ultraviolet, blue, black.`,
    negative_prompt: `clean image, no scanlines, no distortion, realistic look, gender/ethnicity change, distorted face, 
photorealistic, minimal transformation, low noise, soft glitch, muted color, bad lighting, face replacement, male features`,
    strength: 0.45,
    guidance_scale: 8.5
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
