import type { Handler } from "@netlify/functions";
import { json } from "./_lib/http";

// 🎨 Smart prompt enhancement for custom mode
function enhanceCustomPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  let enhanced = prompt;
  
  // Ghibli/Anime style enhancements
  if (lowerPrompt.includes('ghibli') || lowerPrompt.includes('anime') || lowerPrompt.includes('cartoon')) {
    enhanced += ', Studio Ghibli anime aesthetic, large expressive eyes, soft cel-shading, dreamy atmosphere, anime-inspired lighting, stylized features';
  }
  
  // Cyberpunk/Sci-fi enhancements
  if (lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('sci-fi') || lowerPrompt.includes('futuristic')) {
    enhanced += ', neon lighting, futuristic aesthetic, sci-fi atmosphere, glowing elements, high-tech ambiance';
  }
  
  // Artistic/Painting enhancements
  if (lowerPrompt.includes('painting') || lowerPrompt.includes('artistic') || lowerPrompt.includes('oil painting')) {
    enhanced += ', artistic style, painterly texture, brush strokes, artistic composition, creative interpretation';
  }
  
  // Vintage/Retro enhancements
  if (lowerPrompt.includes('vintage') || lowerPrompt.includes('retro') || lowerPrompt.includes('80s') || lowerPrompt.includes('90s')) {
    enhanced += ', vintage aesthetic, retro styling, nostalgic atmosphere, period-appropriate lighting';
  }
  
  // Fantasy/Magical enhancements
  if (lowerPrompt.includes('fantasy') || lowerPrompt.includes('magical') || lowerPrompt.includes('wizard') || lowerPrompt.includes('fairy')) {
    enhanced += ', fantasy atmosphere, magical lighting, ethereal glow, mystical elements, enchanted ambiance';
  }
  
  // Horror/Dark enhancements
  if (lowerPrompt.includes('horror') || lowerPrompt.includes('dark') || lowerPrompt.includes('scary') || lowerPrompt.includes('gothic')) {
    enhanced += ', dark atmosphere, dramatic lighting, moody shadows, gothic aesthetic, atmospheric horror';
  }
  
  // Professional/Photography enhancements
  if (lowerPrompt.includes('professional') || lowerPrompt.includes('photography') || lowerPrompt.includes('studio')) {
    enhanced += ', professional photography, studio lighting, high quality, sharp details, professional composition';
  }
  
  // Add general quality enhancements for all custom prompts
  enhanced += ', high quality, detailed, well-lit, professional result';
  
  return enhanced;
}

export const handler: Handler = async (event) => {
  // Force redeploy - v4
      // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      };
      return {
        statusCode: 200,
        headers: corsHeaders
      };
    }
  try {
    // 🔧 CRITICAL FIX: Allow POST requests for generation
    console.log('🎯 aimlApi function called with method:', event.httpMethod);
    console.log('🎯 Event details:', { 
      method: event.httpMethod, 
      hasBody: !!event.body,
      bodyLength: event.body?.length || 0,
      headers: Object.keys(event.headers || {})
    });
    
    if (event.httpMethod !== 'POST') {
      console.log('❌ Method not allowed:', event.httpMethod);
      return json({
        error: 'Method Not Allowed',
        message: 'This endpoint only accepts POST requests for image generation',
        allowedMethods: ['POST'],
        receivedMethod: event.httpMethod
      }, { status: 405 });
    }
    
    console.log('✅ POST method accepted, proceeding with generation...');

    // Handle header casing - Netlify lowercases header names
    const headers = event.headers || {};
    const auth = headers.authorization || headers.Authorization || '';
    const appKey = headers['x-app-key'] || headers['X-App-Key'] || '';

    // TEMP dev-bypass to unblock POC runs (remove in prod)
    const devBypass = process.env.DEV_ALLOW_NOAUTH === '1';

    if (!auth && !devBypass) {
      console.warn('aimlApi 401 — missing Authorization. Keys seen:', Object.keys(headers).slice(0, 12));
      return json({ error: 'missing_auth_header' }, { status: 401 });
    }
    
    if (!appKey && !devBypass) {
      console.warn('aimlApi 401 — missing x-app-key');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'missing_app_key' })
      };
    }

    // Check if AIML API key is configured
    const API_KEY = process.env.AIML_API_KEY;
    if (!API_KEY) {
      console.error('AIML_API_KEY missing from environment');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'server_missing_upstream_key' })
      };
    }

    // Check if AIML API base is configured
    const BASE = process.env.AIML_API_BASE ?? "https://api.aimlapi.com";
    if (!BASE) {
      console.error('AIML_API_BASE missing from environment');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'server_missing_base_url' })
      };
    }

    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    
    // Handle ping requests for testing
    if (requestBody.ping) {
      console.log('🎯 AIML API ping received:', {
        hasAuth: !!auth,
        hasAppKey: !!appKey,
        devBypass,
        timestamp: new Date().toISOString()
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          ok: true, 
          message: 'AIML API is running and ready for POST requests',
          timestamp: new Date().toISOString(),
          devMode: !!devBypass
        })
      };
    }

    // Structured logging for generation requests
    const logData = {
      timestamp: new Date().toISOString(),
      runId: requestBody.runId || 'unknown',
      presetId: requestBody.presetId || 'unknown',
      mode: requestBody.mode || 'unknown',
      hasImage: !!requestBody.image_url,
      hasPrompt: !!requestBody.prompt,
      strength: requestBody.strength,
      numVariations: requestBody.num_variations || 1,
      devBypass
    };
    
    console.log('🎯 AIML API generation request:', logData);

    // Check if this is a prompt enhancement request (magic wand)
    if (requestBody.action === 'enhance_prompt') {
      console.log('🎯 Magic Wand prompt enhancement request:', {
        prompt: requestBody.prompt,
        enhancementType: requestBody.enhancement_type
      });
      
      // For prompt enhancement, we don't need image_url
      if (!requestBody.prompt) {
        console.error('Missing prompt for enhancement');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'missing_prompt' })
        };
      }
      
      // Return enhanced prompt (simplified for now)
      const enhancedPrompt = requestBody.prompt + ', professional photography style, high quality, sharp details, 8K resolution, enhanced contrast, vibrant colors';
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          ok: true, 
          enhanced_prompt: enhancedPrompt,
          original_prompt: requestBody.prompt,
          enhancement_type: requestBody.enhancement_type
        })
      };
    }

    // Validate required fields for image generation
    if (!requestBody.image_url) {
      console.error('Missing image_url in request');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'missing_image_url' })
      };
    }

    if (!requestBody.prompt) {
      console.error('Missing prompt in request');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'missing_prompt' })
      };
    }

    // 🎨 SMART PROMPT ENHANCEMENT: Enhance custom prompts with style keywords
    let enhancedPrompt = requestBody.prompt;
    
    // Only enhance custom mode prompts to avoid interfering with presets
    if (requestBody.mode === 'custom') {
      enhancedPrompt = enhanceCustomPrompt(requestBody.prompt);
      console.log('🎨 Custom prompt enhanced:', {
        original: requestBody.prompt,
        enhanced: enhancedPrompt
      });
    }
    
    // 🔧 CRITICAL FIX: HARD CLAMP strength to prevent double faces
    const rawStrength = Number(requestBody.strength ?? 0.08);
    const clampedStrength = Math.max(0.06, Math.min(0.10, rawStrength));
    const numVariations = 1; // Always 1 to avoid grids/diptychs
    
    console.log('🔧 Strength clamping applied:', {
      requested: rawStrength,
      clamped: clampedStrength,
      reason: rawStrength > 0.10 ? 'Too high - prevents double faces' : 
              rawStrength < 0.06 ? 'Too low - ensures visible changes' : 'Within safe range'
    });
    
    // Build AIML API payload with SAFE defaults
    const aimlPayload = {
      model: requestBody.model ?? process.env.AIML_MODEL ?? 'stable-diffusion-v35-large',
      prompt: enhancedPrompt,
      image_url: requestBody.image_url,
      strength: clampedStrength, // Use clamped value
      num_variations: numVariations // Always 1
    };

    console.log('🚀 Sending to AIML API:', {
      base: BASE,
      model: aimlPayload.model,
      hasImage: !!aimlPayload.image_url,
      variations: aimlPayload.num_variations
    });

    // Make request to AIML API - use correct endpoint for image generation
    const response = await fetch(`${BASE}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(aimlPayload)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ AIML API error:', response.status, responseText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          ok: false, 
          provider_error: responseText,
          status: response.status 
        })
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse AIML API response:', responseText);
      return {
        statusCode: 502,
        body: JSON.stringify({ 
          ok: false, 
          error: 'INVALID_JSON_RESPONSE',
          raw: responseText 
        })
      };
    }

    // 🧠 DEBUG: Log the complete AIML API response
    console.log("📡 AIML raw result:", JSON.stringify(data, null, 2));
    console.log("📡 AIML response keys:", Object.keys(data));

    // 🧪 TEMPORARY TEST: Uncomment this to test frontend flow
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify({ 
    //     ok: true, 
    //     image_url: "https://res.cloudinary.com/dw2xaqjmg/image/upload/v1/test/fake-generated-image.jpg",
    //     model: aimlPayload.model,
    //     prompt: aimlPayload.prompt
    //   })
    // };

    // Log the full response structure for debugging
    console.log('🔍 AIML API response structure:', {
      keys: Object.keys(data),
      hasImageUrl: !!data.image_url,
      hasOutput: !!data.output,
      hasData: !!data.data,
      hasUrl: !!data.url,
      outputType: typeof data.output,
      dataType: typeof data.data
    });

    // Extract URLs from various possible response formats with support for multiple variations
    let urls = [];
    let variationsGenerated = 1;
    
    // Try multiple extraction strategies for multiple variations
    if (data.images && Array.isArray(data.images)) {
      // 🎯 AIML API format: { "images": [{ "url": "...", "width": 1024, "height": 1024 }] }
      urls = data.images.map(img => img.url).filter(Boolean);
      variationsGenerated = urls.length;
      console.log(`✅ Found ${variationsGenerated} URLs in images array:`, urls);
    } else if (data.image_url) {
      urls = [data.image_url];
      console.log('✅ Found URL in image_url:', urls[0]);
    } else if (data.output && Array.isArray(data.output)) {
      urls = data.output.map(out => out.url).filter(Boolean);
      variationsGenerated = urls.length;
      console.log(`✅ Found ${variationsGenerated} URLs in output array:`, urls);
    } else if (data.output && typeof data.output === 'object' && data.output.url) {
      urls = [data.output.url];
      console.log('✅ Found URL in output.url:', urls[0]);
    } else if (data.data && Array.isArray(data.data)) {
      urls = data.data.map(d => d.url).filter(Boolean);
      variationsGenerated = urls.length;
      console.log(`✅ Found ${variationsGenerated} URLs in data array:`, urls);
    } else if (data.data && typeof data.data === 'object' && data.data.url) {
      urls = [data.data.url];
      console.log('✅ Found URL in data.url:', urls[0]);
    } else if (data.url) {
      urls = [data.url];
      console.log('✅ Found URL in url:', urls[0]);
    } else if (data.result_url) {
      urls = [data.result_url];
      console.log('✅ Found URL in result_url:', urls[0]);
    } else if (data.generated_image) {
      urls = [data.generated_image];
      console.log('✅ Found URL in generated_image:', urls[0]);
    } else if (data.image) {
      urls = [data.image];
      console.log('✅ Found URL in image:', urls[0]);
    }

    if (urls.length === 0) {
      console.error('❌ No image URLs found in AIML response. Full response:', JSON.stringify(data, null, 2));
      return {
        statusCode: 502,
        body: JSON.stringify({ 
          ok: false, 
          error: 'NO_URL_FROM_PROVIDER',
          raw: data,
          attempted_keys: ['images[0].url', 'image_url', 'output.url', 'output[0].url', 'data.url', 'data[0].url', 'url', 'result_url', 'generated_image', 'image']
        })
      };
    }

    console.log(`✅ AIML API success, ${variationsGenerated} URL(s) extracted:`, urls);

    // 🔧 CRITICAL FIX: Return consistent response format with CORS headers
    const responseHeaders = {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    };

    // Return response with support for multiple variations
    const responseBody: any = {
      ok: true,
      model: aimlPayload.model,
      prompt: aimlPayload.prompt,
      variations_generated: variationsGenerated,
      strength_used: clampedStrength, // Show what strength was actually used
      strength_requested: rawStrength // Show what was requested
    };

    // For backward compatibility, always include image_url (first variation)
    responseBody.image_url = urls[0];
    
    // If multiple variations, include result_urls array
    if (urls.length > 1) {
      responseBody.result_urls = urls;
    }

    // 🔍 DEBUG: Log the exact response being sent
    console.log('🔍 Final response body:', JSON.stringify(responseBody, null, 2));
    console.log('🔍 Response headers:', responseHeaders);

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('💥 AIML API function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        ok: false, 
        error: 'INTERNAL_ERROR',
        message: error.message 
      })
    };
  }
}


