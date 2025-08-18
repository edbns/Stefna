import type { Handler } from "@netlify/functions";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  // Force redeploy - v4
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
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

    // Validate required fields for generation
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

    // Build AIML API payload with variations support
    const aimlPayload = {
      model: requestBody.model ?? process.env.AIML_MODEL ?? 'flux/dev/image-to-image',
      prompt: requestBody.prompt,
      image_url: requestBody.image_url,
      strength: requestBody.strength || 0.8,
      num_variations: requestBody.num_variations || 1
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

    // Extract URL from various possible response formats with more fallbacks
    let url = null;
    
    // Try multiple extraction strategies
    if (data.image_url) {
      url = data.image_url;
      console.log('✅ Found URL in image_url:', url);
    } else if (data.output && Array.isArray(data.output) && data.output[0]?.url) {
      url = data.output[0].url;
      console.log('✅ Found URL in output[0].url:', url);
    } else if (data.output && typeof data.output === 'object' && data.output.url) {
      url = data.output.url;
      console.log('✅ Found URL in output.url:', url);
    } else if (data.data && Array.isArray(data.data) && data.data[0]?.url) {
      url = data.data[0].url;
      console.log('✅ Found URL in data[0].url:', url);
    } else if (data.data && typeof data.data === 'object' && data.data.url) {
      url = data.data.url;
      console.log('✅ Found URL in data.url:', url);
    } else if (data.url) {
      url = data.url;
      console.log('✅ Found URL in url:', url);
    } else if (data.result_url) {
      url = data.result_url;
      console.log('✅ Found URL in result_url:', url);
    } else if (data.generated_image) {
      url = data.generated_image;
      console.log('✅ Found URL in generated_image:', url);
    } else if (data.image) {
      url = data.image;
      console.log('✅ Found URL in image:', url);
    }

    if (!url) {
      console.error('❌ No image URL found in AIML response. Full response:', JSON.stringify(data, null, 2));
      return {
        statusCode: 502,
        body: JSON.stringify({ 
          ok: false, 
          error: 'NO_URL_FROM_PROVIDER',
          raw: data,
          attempted_keys: ['image_url', 'output.url', 'output[0].url', 'data.url', 'data[0].url', 'url', 'result_url', 'generated_image', 'image']
        })
      };
    }

    console.log('✅ AIML API success, URL extracted:', url);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        ok: true, 
        image_url: url,
        model: aimlPayload.model,
        prompt: aimlPayload.prompt
      })
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


