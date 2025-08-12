// Minimal I2I-only images endpoint with clear errors
const pickUrl = (j: any) =>
  j?.images?.[0]?.url ?? j?.data?.[0]?.url ?? j?.videos?.[0]?.url ?? j?.result_url ?? null;

const bad = (s: number, m: any) => ({
  statusCode: s,
  body: typeof m === 'string' ? JSON.stringify({ error: m }) : JSON.stringify(m),
});

const ok = (b: any) => ({
  statusCode: 200,
  body: JSON.stringify(b),
});

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export const handler = async (event: any) => {
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
    let body: any = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return bad(400, 'Invalid JSON body'); }

    // Input validation
    const image_url: string = body.image_url;
    const resource_type: string = body.resource_type || 'image';
    const request_id: string = body.request_id || crypto.randomUUID();
    
    // Extract JWT and get user ID early (needed for both image and video processing)
    const auth = event.headers?.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return bad(401, 'Missing Authorization token');

    // Decode JWT to get user ID
    const claims = JSON.parse(Buffer.from((token.split('.')[1] || ''), 'base64').toString() || '{}');
    const userId = claims.sub || claims.uid || claims.user_id || claims.userId || claims.id;
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return bad(401, 'Invalid user token');
    }
    
    if (resource_type === 'video') {
      // Video processing - check if video_jobs table exists first
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        // Check if video_jobs table exists
        const { error: tableCheckError } = await supabaseAdmin
          .from('video_jobs')
          .select('id')
          .limit(1);

        if (tableCheckError && tableCheckError.code === '42P01') {
          // Table doesn't exist - return proper error
          console.log('[aimlApi] video_jobs table not found, returning 501');
          return bad(501, 'Video editing not enabled yet - video_jobs table missing');
        }

        // Insert video job
        const { data, error } = await supabaseAdmin
          .from('video_jobs')
          .insert({
            user_id: userId,
            source_url: image_url, // Use image_url for video source
            prompt: String(body.prompt || 'stylize').trim(),
            model: body.model || 'flux/dev/video-to-video',
            strength: clamp(Number(body.strength ?? 0.85), 0.4, 0.95),
            num_inference_steps: Math.round(clamp(Number(body.num_inference_steps ?? body.steps ?? 36), 1, 150)),
            guidance_scale: Number.isFinite(body.guidance_scale) ? body.guidance_scale : 7.5,
            seed: body.seed || Date.now(),
            fps: body.fps,
            width: body.width,
            height: body.height,
            duration_ms: body.duration_ms,
            allow_remix: body.allow_remix || false,
            visibility: body.visibility || 'private'
          })
          .select('id')
          .single();

        if (error) {
          console.error('[aimlApi] video job creation failed:', error);
          return bad(400, { error: 'Failed to create video job', details: error.message });
        }

        // Kick worker (fire-and-forget)
        fetch(`${process.env.URL}/.netlify/functions/video-job-worker`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'x-internal':'1' },
          body: JSON.stringify({ job_id: data.id })
        }).catch(() => { /* ignore */ });

        return {
          statusCode: 202,
          body: JSON.stringify({ 
            job_id: data.id, 
            status: 'queued',
            message: 'Video job created successfully'
          })
        };
      } catch (videoError: any) {
        console.error('[aimlApi] video job error:', videoError);
        return bad(500, { error: 'Video job creation failed', details: videoError.message });
      }
    }
    
    if (!image_url || !/^https?:\/\//i.test(image_url) || image_url.includes('...')) {
      return bad(400, 'image_url must be a full https URL (no "...")');
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

      const text = await resp.text();
      let json: any = null; try { json = JSON.parse(text); } catch {}

      if (!resp.ok) {
        console.error('[aimlApi] AIML error:', { status: resp.status, body: json || text });
        // Bubble up provider details (400/401/etc) so the UI can show real reason
        return bad(resp.status, json || text || { error: 'AIML error' });
      }

      const result_url = pickUrl(json);
      if (!result_url) return bad(502, { error: 'No image returned by provider', provider: json });

      console.log('[aimlApi] success:', { result_url: result_url.substring(0, 50) + '...' });

      // CHARGE CREDITS - Only after successful generation
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        // 1) Idempotent guard: if we already charged, skip
        const { data: already, error: alreadyErr } = await supabaseAdmin
          .from('credits_ledger')
          .select('id')
          .eq('request_id', request_id)
          .single();

        if (!already && !alreadyErr) {
          // 2) Insert a single credit charge (1 credit per I2I generation)
          const { error: chargeErr } = await supabaseAdmin
            .from('credits_ledger')
            .insert({
              user_id: userId,
              amount: 1,
              reason: 'i2i_generate',
              request_id: request_id,
              env: APP_ENV
            });

          if (chargeErr) {
            console.error('[aimlApi] charge credits failed:', chargeErr);
            // Don't fail the generation response; just log the charging error
          } else {
            console.log('[aimlApi] charged 1 credit for user:', userId);
          }
        } else {
          console.log('[aimlApi] credits already charged for request_id:', request_id);
        }
      } catch (chargeError) {
        console.error('[aimlApi] credit charging error:', chargeError);
        // Don't fail the generation response; just log the charging error
      }

      // Return result as usual (also echo request_id for debugging)
      return ok({ result_url, request_id });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[aimlApi] timeout after 30s');
        return bad(504, 'Request timeout - try reducing num_inference_steps to 36-40');
      }
      throw fetchError;
    }
  } catch (e: any) {
    console.error('[aimlApi] unexpected error:', e);
    return bad(500, e?.message || 'aimlApi crashed');
  }
};


