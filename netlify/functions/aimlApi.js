// Minimal I2I-only images endpoint with clear errors
const pickUrl = (j) =>
  j?.images?.[0]?.url ?? j?.data?.[0]?.url ?? j?.videos?.[0]?.url ?? j?.result_url ?? null;

const bad = (s, m) => ({
  statusCode: s,
  body: typeof m === 'string' ? JSON.stringify({ error: m }) : JSON.stringify(m),
});

const ok = (b) => ({
  statusCode: 200,
  body: JSON.stringify(b),
});

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

exports.handler = async (event) => {
  console.log('[aimlApi]', { 
    method: event.httpMethod, 
    hasAuth: !!(event.headers?.authorization), 
    now: new Date().toISOString() 
  });
  
  try {
    if (event.httpMethod !== 'POST') return bad(405, 'Method Not Allowed');

    // Validate env early (so you never get a generic 500)
    if (!process.env.AIML_API_KEY) {
      return bad(500, 'AIML_API_KEY is not configured in this deploy');
    }

    // Parse body
    let body = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return bad(400, 'Invalid JSON body'); }

    // Input validation
    const image_url = body.image_url;
    const resource_type = body.resource_type || 'image';
    const request_id = body.request_id || crypto.randomUUID();
    
    if (resource_type === 'video') {
      return bad(501, {
        error: 'Video editing not enabled yet',
        hint: 'We are wiring asynchronous video jobs. Please try an image for now.',
      });
    }
    
    if (!image_url || !/^https?:\/\//i.test(image_url) || image_url.includes('...')) {
      return bad(400, 'image_url must be a full https URL (no "...")');
    }

    // Extract JWT and get user ID
    const auth = event.headers?.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return bad(401, 'Missing Authorization token');

    // Decode JWT to get user ID
    const claims = JSON.parse(Buffer.from((token.split('.')[1] || ''), 'base64').toString() || '{}');
    const userId = claims.sub || claims.uid || claims.user_id || claims.userId || claims.id;
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return bad(401, 'Invalid user token');
    }

    // Auto-detect environment
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod';

    const payload = {
      model: 'flux/dev/image-to-image',
      prompt: String(body.prompt || 'stylize').trim(),
      image_url,
      strength: clamp(Number(body.strength ?? 0.75), 0.4, 0.95),
      num_inference_steps: Math.round(clamp(Number(body.num_inference_steps ?? body.steps ?? 36), 1, 150)),
      guidance_scale: Number.isFinite(body.guidance_scale) ? body.guidance_scale : 7.5,
      seed: body.seed || Date.now(), // Add seed to prevent provider-side caching
    };

    console.log('[aimlApi] calling AIML with:', { 
      prompt: payload.prompt, 
      strength: payload.strength, 
      steps: payload.num_inference_steps,
      guidance: payload.guidance_scale,
      userId,
      request_id,
      env: APP_ENV
    });

    // Call AIML with timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const resp = await fetch('https://api.aimlapi.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AIML_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[aimlApi] AIML API error:', resp.status, errorText);
        return bad(502, `AIML API error: ${resp.status} - ${errorText}`);
      }

      const result = await resp.json();
      const imageUrl = pickUrl(result);

      if (!imageUrl) {
        console.error('[aimlApi] No image URL in AIML response:', result);
        return bad(502, 'No image URL returned from AIML API');
      }

      console.log('[aimlApi] Success:', { imageUrl, userId, request_id, env: APP_ENV });

      return ok({
        success: true,
        image_url: imageUrl,
        request_id,
        user_id: userId,
        env: APP_ENV,
        prompt: payload.prompt,
        strength: payload.strength,
        steps: payload.num_inference_steps,
        guidance: payload.guidance_scale,
        seed: payload.seed,
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[aimlApi] Request timeout after 30s');
        return bad(504, 'Request timeout - AIML API took too long to respond');
      }

      console.error('[aimlApi] Fetch error:', fetchError);
      return bad(502, `Network error calling AIML API: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('[aimlApi] Unexpected error:', error);
    return bad(500, 'Internal server error');
  }
};


