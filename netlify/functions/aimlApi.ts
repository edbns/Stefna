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
      model: 'flux/dev/image-to-image',
      prompt: String(requestBody.prompt).trim(),
      image_url: requestBody.image_url,
      strength: Number(requestBody.strength ?? 0.75),
      num_inference_steps: Number(requestBody.num_inference_steps ?? requestBody.steps ?? 36),
      guidance_scale: Number(requestBody.guidance_scale ?? 7.5),
      seed: requestBody.seed || Date.now(),
      // Add variations support
      n: Number(requestBody.num_variations ?? 1) // Number of variations to generate
    };

    console.log('🚀 Calling upstream AIML API with payload:', {
      ...logData,
      model: aimlPayload.model,
      steps: aimlPayload.num_inference_steps,
      guidance: aimlPayload.guidance_scale,
      variations: aimlPayload.n
    });

    // Call upstream AIML API
    const startTime = Date.now();
    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(aimlPayload)
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upstream AIML API error:', {
        ...logData,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        duration
      });
      
      return new Response(JSON.stringify({ 
        error: `Upstream AIML API failed: ${response.status} ${response.statusText}`,
        details: errorText,
        runId: requestBody.runId
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    
    // Process multiple variations if they exist
    let processedResult = result;
    if (aimlPayload.n > 1 && result.data && Array.isArray(result.data)) {
      // Multiple variations were generated
      const variations = result.data.map((item: any, index: number) => ({
        ...item,
        variation_index: index,
        variation_id: `${requestBody.runId || 'unknown'}-${index}`
      }));
      
      processedResult = {
        ...result,
        data: variations,
        variations_generated: variations.length,
        result_urls: variations.map((v: any) => v.url).filter(Boolean)
      };
      
      console.log('🎭 Multiple variations generated:', {
        ...logData,
        requested: aimlPayload.n,
        generated: variations.length,
        urls: processedResult.result_urls
      });
    } else {
      // Single result - add compatibility fields
      processedResult = {
        ...result,
        variations_generated: 1,
        result_urls: result.data?.[0]?.url ? [result.data[0].url] : []
      };
    }
    
    console.log('✅ AIML API generation successful:', {
      ...logData,
      duration,
      hasImages: !!result.images,
      imageCount: result.images?.length || 0,
      hasData: !!result.data,
      variationsGenerated: processedResult.variations_generated,
      resultUrls: processedResult.result_urls?.length || 0
    });

    return new Response(JSON.stringify(processedResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 AIML API critical error:', error);
    return new Response(JSON.stringify({ 
      error: String(error?.message || error),
      runId: JSON.parse(event.body || '{}')?.runId || 'unknown'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


