export default async (event) => {
  // Add debug logging for headers
  console.log('aimlApi headers snapshot', {
    keys: Object.keys(event.headers || {}).slice(0, 12),
    hasXAppKey: Boolean(event.headers?.['x-app-key']),
    hasAuth: Boolean(event.headers?.authorization),
    method: event.httpMethod
  });

  // CORS (and OPTIONS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, x-app-key, authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  // Simple app key authentication
  const ok = event.headers?.['x-app-key'] === process.env.FUNCTION_APP_KEY;
  if (!ok) {
    console.error('Invalid or missing x-app-key header', {
      received: event.headers?.['x-app-key'],
      expected: process.env.FUNCTION_APP_KEY ? 'set' : 'missing'
    })
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  const API_KEY = process.env.AIML_API_KEY;
  if (!API_KEY) {
    console.error('AIML_API_KEY missing from environment')
    return new Response(JSON.stringify({ error: 'AIML_API_KEY missing' }), { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = JSON.parse(event.body || '{}')
    console.log('AIML API request:', { 
      hasImage: !!body.image_url, 
      hasPrompt: !!body.prompt,
      mode: body.mode || 'unknown'
    })
    
    // Call AIML API with the provided parameters
    const payload = {
      model: 'flux/dev/image-to-image',
      prompt: String(body.prompt || 'stylize').trim(),
      image_url: body.image_url,
      strength: Number(body.strength ?? 0.75),
      num_inference_steps: Number(body.num_inference_steps ?? body.steps ?? 36),
      guidance_scale: Number(body.guidance_scale ?? 7.5),
      seed: body.seed || Date.now(),
    };

    console.log('Calling AIML with payload:', payload);

    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AIML API error:', response.status, errorText);
      throw new Error(`AIML API failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('AIML API success:', { hasImages: !!result.images });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('AIML API error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}


