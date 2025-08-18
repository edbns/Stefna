import type { Handler } from "@netlify/functions";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  // Force redeploy - v3
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

    // Make request to AIML API
    const response = await fetch(`${BASE}/v1/generate`, {
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

    // Extract URL from various possible response formats
    const url = data.image_url ?? data.output?.[0]?.url ?? data.data?.[0]?.url ?? data.url ?? null;

    if (!url) {
      console.error('❌ No image URL in AIML response:', data);
      return {
        statusCode: 502,
        body: JSON.stringify({ 
          ok: false, 
          error: 'NO_URL_FROM_PROVIDER',
          raw: data 
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


