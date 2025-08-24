import type { Handler } from '@netlify/functions';

// Identity-Safe Generation using AIML API with face preservation
// This is the fallback system when primary generation fails IPA checks

interface IdentitySafeGenerationRequest {
  prompt: string;
  imageUrl: string;
  strength?: number;
  guidance?: number;
  mode?: 'identity-safe' | 'neo-tokyo-glitch' | 'check-status';
  preset?: string;
}

interface IdentitySafeGenerationResponse {
  success: boolean;
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get: string;
    cancel: string;
  };
  output?: string[];
  message: string;
}

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body: IdentitySafeGenerationRequest = JSON.parse(event.body || '{}');
    const { mode = 'identity-safe', preset = 'base' } = body;

    console.log('🔍 Identity-safe generation request:', {
      mode,
      preset,
      hasPrompt: !!body.prompt,
      hasImageUrl: !!body.imageUrl,
      strength: body.strength,
      guidance: body.guidance
    });

    // Route to appropriate handler based on mode
    switch (mode) {
      case 'neo-tokyo-glitch':
        return await handleNeoTokyoGlitchGeneration(body, headers);
      case 'check-status':
      return await handleStatusCheck(body, headers);
      case 'identity-safe':
      default:
        return await handleIdentitySafeGeneration(body, headers);
    }

  } catch (error: any) {
    console.error('💥 Identity-safe generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      }),
    };
  }
};

async function handleNeoTokyoGlitchGeneration(body: IdentitySafeGenerationRequest, headers: any) {
  const { prompt, imageUrl, strength = 0.5, guidance = 6.0, preset = 'base' } = body;

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

  // Check if AIML API key is configured
  if (!process.env.AIML_API_KEY) {
    console.error('AIML_API_KEY environment variable not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AIML API not configured' }),
    };
  }

  // Neo Tokyo Glitch preset configurations for identity preservation
  const presetConfigs = {
    'visor': { strength: 0.35, guidance_scale: 5.5, model: 'flux/dev/image-to-image' },
    'base': { strength: 0.30, guidance_scale: 5.0, model: 'flux/dev/image-to-image' },
    'tattoos': { strength: 0.40, guidance_scale: 6.0, model: 'flux/dev/image-to-image' },
    'scanlines': { strength: 0.35, guidance_scale: 5.5, model: 'flux/dev/image-to-image' }
  };

  const presetConfig = presetConfigs[preset as keyof typeof presetConfigs] || presetConfigs.base;

  // Enhanced prompt for face preservation
  const enhancedPrompt = `${prompt}, preserve facial identity, maintain original face structure, keep facial features intact, identity-safe generation`;
  
  // Enhanced negative prompt for face preservation
  const negativePrompt = 'face distortion, facial deformation, identity loss, different person, face morphing, facial hallucination, multiple faces, face swap, identity change';

  console.log('🎯 Neo Tokyo Glitch identity-safe generation:', {
    hasApiKey: !!process.env.AIML_API_KEY,
    model: presetConfig.model,
    strength: presetConfig.strength,
    guidance: presetConfig.guidance_scale,
    preset
  });

  console.log('⚡ Calling AIML API for identity-safe Neo Tokyo Glitch');
  console.log('🌐 AIML endpoint: https://api.aimlapi.com/v1/images/generations');

  try {
    // Call AIML API for identity-safe generation
    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
          body: JSON.stringify({
        model: presetConfig.model,
        prompt: enhancedPrompt,
        image_url: imageUrl,
          negative_prompt: negativePrompt,
          strength: presetConfig.strength,
          guidance_scale: presetConfig.guidance_scale,
          num_inference_steps: 40,
        num_variations: 1,
          seed: Math.floor(Math.random() * 1000000), // Random seed for variety
      }),
  });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ AIML API error:', {
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

    const result = await response.json();
    
    console.log('✅ Identity-safe Neo Tokyo Glitch generation completed:', {
      hasImages: !!result.images,
      hasOutput: !!result.output,
      hasData: !!result.data,
    preset
  });

    // Extract image URL from various possible response formats
    let imageUrl = null;
    if (result.images && Array.isArray(result.images) && result.images[0]?.url) {
      imageUrl = result.images[0].url;
    } else if (result.output && Array.isArray(result.output) && result.output[0]) {
      imageUrl = result.output[0];
    } else if (result.data && Array.isArray(result.data) && result.data[0]?.url) {
      imageUrl = result.data[0].url;
    } else if (result.image_url) {
      imageUrl = result.image_url;
    }

    if (!imageUrl) {
      console.error('❌ No image URL found in AIML response');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Generation completed but no image URL found',
          response: result
        })
      };
    }

    const response_data: IdentitySafeGenerationResponse = {
      success: true,
      id: `identity_safe_${Date.now()}`,
      status: 'completed',
      created_at: new Date().toISOString(),
      output: [imageUrl],
      message: `Identity-safe Neo Tokyo Glitch (${preset}) generation completed successfully`
  };

  return {
    statusCode: 200,
    headers,
      body: JSON.stringify(response_data),
    };

  } catch (error: any) {
    console.error('❌ Identity-safe generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Generation failed',
        message: error.message || 'Unknown error'
      }),
    };
  }
}

async function handleIdentitySafeGeneration(body: IdentitySafeGenerationRequest, headers: any) {
  const { prompt, imageUrl, strength = 0.4, guidance = 6.0 } = body;

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

  // Check if AIML API key is configured
  if (!process.env.AIML_API_KEY) {
    console.error('AIML_API_KEY environment variable not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AIML API not configured' }),
    };
  }

  console.log('🚀 Starting identity-safe generation:', {
    hasApiKey: !!process.env.AIML_API_KEY,
    strength,
    guidance
  });

  // Enhanced prompt for identity preservation
  const identityPrompt = `${prompt}, preserve facial identity, maintain original face structure, keep facial features intact, identity-safe generation`;
  
  // Strong negative prompt for identity preservation
  const negativePrompt = 'face distortion, facial deformation, identity loss, different person, face morphing, facial hallucination, multiple faces, face swap, identity change, ugly face, bad anatomy';

  try {
    // Call AIML API for identity-safe generation
    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux/dev/image-to-image',
        prompt: identityPrompt,
        image_url: imageUrl,
        negative_prompt: negativePrompt,
        strength: strength,
        guidance_scale: guidance,
        num_inference_steps: 50,
        num_variations: 1,
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ AIML API error:', {
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

    const result = await response.json();
    
    console.log('✅ Identity-safe generation completed successfully');

    // Extract image URL from response
    let outputImageUrl = null;
    if (result.images && Array.isArray(result.images) && result.images[0]?.url) {
      outputImageUrl = result.images[0].url;
    } else if (result.output && Array.isArray(result.output) && result.output[0]) {
      outputImageUrl = result.output[0];
    } else if (result.data && Array.isArray(result.data) && result.data[0]?.url) {
      outputImageUrl = result.data[0].url;
    } else if (result.image_url) {
      outputImageUrl = result.image_url;
    }

    if (!outputImageUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Generation completed but no image URL found'
        })
      };
    }

    const response_data: IdentitySafeGenerationResponse = {
      success: true,
      id: `identity_safe_${Date.now()}`,
      status: 'completed',
      created_at: new Date().toISOString(),
      output: [outputImageUrl],
      message: 'Identity-safe generation completed successfully'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response_data),
    };

  } catch (error: any) {
    console.error('❌ Identity-safe generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Generation failed',
        message: error.message || 'Unknown error'
      }),
    };
  }
}

async function handleStatusCheck(body: IdentitySafeGenerationRequest, headers: any) {
  // For AIML API, generations are typically synchronous, so status is always completed
  // This is mainly for compatibility with the existing interface
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      id: 'status_check',
      status: 'completed',
      created_at: new Date().toISOString(),
      message: 'Status check completed - AIML generations are synchronous'
    }),
  };
}
