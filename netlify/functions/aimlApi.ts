export default async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle header casing - Netlify lowercases header names
    const headers = event.headers || {};
    const auth = headers.authorization || headers.Authorization || '';
    const appKey = headers['x-app-key'] || headers['X-App-Key'] || '';

    // TEMP dev-bypass to unblock POC runs (remove in prod)
    const devBypass = process.env.DEV_ALLOW_NOAUTH === '1';

    if (!auth && !devBypass) {
      console.warn('aimlApi 401 — missing Authorization. Keys seen:', Object.keys(headers).slice(0, 12));
      return new Response(JSON.stringify({ error: 'missing_auth_header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!appKey && !devBypass) {
      console.warn('aimlApi 401 — missing x-app-key');
      return new Response(JSON.stringify({ error: 'missing_app_key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if AIML API key is configured
    const API_KEY = process.env.AIML_API_KEY;
    if (!API_KEY) {
      console.error('AIML_API_KEY missing from environment');
      return new Response(JSON.stringify({ error: 'server_missing_upstream_key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if AIML API base is configured
    const BASE = process.env.AIML_API_BASE ?? "https://api.aimlapi.com";
    if (!BASE) {
      console.error('AIML_API_BASE missing from environment');
      return new Response(JSON.stringify({ error: 'server_missing_base_url' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    
    // Handle ping requests for testing
    if (requestBody.ping) {
      console.log('AIML API ping received:', {
        hasAuth: !!auth,
        hasAppKey: !!appKey,
        devBypass,
        timestamp: new Date().toISOString()
      });
      return new Response(JSON.stringify({ 
        ok: true, 
        message: 'AIML API is running',
        timestamp: new Date().toISOString(),
        devMode: !!devBypass
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ error: 'missing_image_url' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!requestBody.prompt) {
      console.error('Missing prompt in request');
      return new Response(JSON.stringify({ error: 'missing_prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ 
        ok: false, 
        provider_error: responseText,
        status: response.status 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse AIML API response:', responseText);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'INVALID_JSON_RESPONSE',
        raw: responseText 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract URL from various possible response formats
    const url = data.image_url ?? data.output?.[0]?.url ?? data.data?.[0]?.url ?? data.url ?? null;

    if (!url) {
      console.error('❌ No image URL in AIML response:', data);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'NO_URL_FROM_PROVIDER',
        raw: data 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ AIML API success, URL extracted:', url);

    return new Response(JSON.stringify({ 
      ok: true, 
      image_url: url,
      model: aimlPayload.model,
      prompt: aimlPayload.prompt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 AIML API function error:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'INTERNAL_ERROR',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


