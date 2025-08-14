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

// Pick a better default unless the caller explicitly asks for "fast"
const pickI2IModel = (body: any) => {
  const req = String(body.quality || body.tier || '').toLowerCase();
  if (req === 'fast' || req === 'cheap') return 'flux/dev/image-to-image';
  // Prefer your crisper model here
  return body.model || 'stable-diffusion-v35-large'; // higher fidelity
};

// --- Sharpening & subject locks ---
const CLARITY_BOOST_HARD =
  "maximize micro-contrast and fine detail; razor-sharp edges; crisp textures (hair, neoprene seams, surfboard wax); strictly no halos or oversharpening artifacts; preserve natural skin texture";

const SURFER_POS_LOCK =
  "same subject, adult male surfer, holding a surfboard, same clothing and gear, same pose and camera angle, same composition on a beach with ocean waves";

const SURFER_NEG_DRIFT =
  "female, woman, girl, bikini, makeup glam, banana, banana boat, inflatable, kayak, canoe, raft, jetski, paddle, oar, dinghy, extra people, different subject, face swap, body swap";

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
    const num_variations: number = Math.max(1, Math.min(Number(body.num_variations) || 1, 4)); // Limit to 1-4 variations
    
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
    
    // Check if this is a Story Mode request (should become a video job)
    const isStory = body.modeMeta?.mode === 'story' || body.mode === 'story';

    if (isStory) {
      // Force video path for Story Mode - generate 4-shot MP4
      const numShots = clamp(Number(body.num_shots ?? 4), 3, 6);
      const fps = clamp(Number(body.fps ?? 30), 24, 60);

      // Simple 4-beat surfer shotlist (customize per theme)
      const shotlist = [
        { name: 'establish', add: 'wide beach establishing shot, horizon and waves', duration_ms: 2600 },
        { name: 'paddle',    add: 'medium shot paddling out, water splashes',       duration_ms: 2600 },
        { name: 'ride',      add: 'dynamic action carving on a wave, spray, speed', duration_ms: 2600 },
        { name: 'hero',      add: 'close-up at shore, board under arm, sunset',     duration_ms: 2600 },
      ].slice(0, numShots);

      // Store everything the worker needs
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

      const { data, error } = await supabaseAdmin
        .from('video_jobs')
        .insert({
          user_id: userId,
          type: 'story',                   // <-- mark as story
          source_url: image_url,           // base image for I2I
          prompt: String(body.prompt || 'high-fidelity edit; preserve subject and composition'),
          model: pickI2IModel(body),
          params: {
            strength: clamp(Number(body.strength ?? 0.28), 0.22, 0.35),
            steps: Math.round(clamp(Number(body.num_inference_steps ?? body.steps ?? 32), 1, 150)),
            guidance: Number.isFinite(Number(body.cfg_scale ?? body.guidance_scale)) ? Number(body.cfg_scale ?? body.guidance_scale) : 7.2,
            negative: String(body.negative_prompt || ''),
          },
          shotlist,
          fps,
          width: body.width ?? 1080,
          height: body.height ?? 1920,
          allow_remix: !!body.allow_remix,
          visibility: body.visibility || 'private',
          request_id
        })
        .select('id')
        .single();

      if (error) return bad(400, { error: 'Failed to create story job', details: error.message });

      // Kick the worker
      fetch(`${process.env.URL}/.netlify/functions/video-job-worker`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-internal':'1' },
        body: JSON.stringify({ job_id: data.id })
      }).catch(() => {});

      return ok({ job_id: data.id, status: 'queued', kind: 'story' });
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
    
    if (!image_url || /^blob:/i.test(image_url)) {
      return bad(400, 'Upload required: image_url must be a reachable https URL (no blob: URLs)');
    }
    
    if (!/^https?:\/\//i.test(image_url) || image_url.includes('...')) {
      return bad(400, 'image_url must be a full https URL (no "...")');
    }

    // Auto-detect environment
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod';

    // Build mode-aware prompt with subject preservation
    const basePrompt = String(
      body.prompt || 'high-fidelity edit; preserve subject and composition'
    ).trim();
    const keepSubject = 'Keep the same people, faces, pose, and framing. Do not add or remove people.';
    const noChildDrift = 'no children, no baby, no toddler, keep adult facial proportions';
    
    let finalPrompt = basePrompt;
    let finalNegativePrompt = '';
    // Parse guidance robustly (handles string/number)
    const requestedCfg = Number(body.cfg_scale ?? body.guidance_scale);
    let finalGuidanceScale = Number.isFinite(requestedCfg) ? requestedCfg : 7.2;
    
    // Mode-aware strength ranges (no more capping!)
    const mode = body.modeMeta?.mode;
    
    function pickStrength(input: any) {
      const s = Number(input);
      if (mode === 'restore')        return clamp(isFinite(s) ? s : 0.22, 0.15, 0.35);
      if (mode === 'time_machine')   return clamp(isFinite(s) ? s : 0.45, 0.30, 0.65);
      if (mode === 'story')          return clamp(isFinite(s) ? s : 0.55, 0.40, 0.75); // push look
      // default i2i edit
      return clamp(isFinite(s) ? s : 0.40, 0.25, 0.80);
    }
    
    let finalStrength = pickStrength(body.strength);
    
    // Mode-specific enhancements for subject preservation
    if (mode === 'time_machine') {
      const era = body.modeMeta.era || 'vintage';
      finalPrompt = `${basePrompt} Reimagine in the ${era} aesthetic. ${keepSubject}`;
      finalGuidanceScale = Number.isFinite(requestedCfg) ? requestedCfg : 7.2;
    } else if (mode === 'story') {
      finalPrompt = `${basePrompt} ${keepSubject}`;
      finalGuidanceScale = Number.isFinite(requestedCfg) ? requestedCfg : 6.8;
    } else if (mode === 'restore') {
      finalPrompt = `${basePrompt} ${keepSubject}`;
      finalGuidanceScale = Number.isFinite(requestedCfg) ? requestedCfg : 7.6; // tiny bump helps edges
    }
    
    // Detail level (defaults to hard)
    const detail = String(body.detail || 'hard').toLowerCase();
    if (detail === 'hard') {
      finalPrompt = `${finalPrompt}. ${CLARITY_BOOST_HARD}`;
    }

    // Subject lock: male surfer + surfboard
    const lockSurfer =
      !!body.lock_surfer ||
      body.subject === 'male_surfer' ||
      /(^|[\s;.,])surfer([\s;.,]|$)/i.test(basePrompt);

    if (lockSurfer) {
      finalPrompt = `${finalPrompt}. ${SURFER_POS_LOCK}`;
    }
    
    // Build comprehensive negative prompt
    const negativePrompts = [
      body.negative_prompt,
      'low quality, distortions, extra fingers, artifacts, wrong number of people, different person, face swap',
      'no boats other than a surfboard',
      'no gear changes'
    ];

    if (lockSurfer) negativePrompts.push(SURFER_NEG_DRIFT);

    const finalNegativePrompt = negativePrompts.filter(Boolean).join(', ');

    const model = body.model || 'stable-diffusion-v35-large'; // Premium default
    const payload = {
      model,
      prompt: finalPrompt,
      negative_prompt: finalNegativePrompt,
      image_url,
      strength: finalStrength,
      num_inference_steps: Math.round(clamp(Number(body.num_inference_steps ?? body.steps ?? 40), 20, 80)), // Bump steps for premium models
      guidance_scale: finalGuidanceScale,
      seed: body.seed || Date.now(), // Add seed to prevent provider-side caching
      // Optional sharp parameters (if supported by AIML)
      sampler: body.sampler || 'dpmpp_2m_sde',
      cfg_scale: finalGuidanceScale, // Alternative parameter name
    };

    console.log('[aimlApi] calling AIML with:', { 
      prompt: payload.prompt, 
      negative_prompt: payload.negative_prompt,
      strength: payload.strength, 
      steps: payload.num_inference_steps,
      guidance: payload.guidance_scale,
      mode: body.modeMeta?.mode,
      userId,
      request_id,
      num_variations,
      env: APP_ENV
    });

    // Generate multiple variations if requested
    const results: string[] = [];
    const errors: any[] = [];

    for (let i = 0; i < num_variations; i++) {
      // Use different seeds for each variation to ensure variety
      const variationPayload = {
        ...payload,
        seed: (payload.seed || Date.now()) + i * 1000 + Math.floor(Math.random() * 1000)
      };

      console.log(`[aimlApi] generating variation ${i + 1}/${num_variations} with seed:`, variationPayload.seed);

      // Call AIML with timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout per variation
      
      try {
        const resp = await fetch('https://api.aimlapi.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.AIML_API_KEY}`,
          },
          body: JSON.stringify(variationPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const text = await resp.text();
        let json: any = null; try { json = JSON.parse(text); } catch {}

        if (!resp.ok) {
          console.error(`[aimlApi] AIML error for variation ${i + 1}:`, { status: resp.status, body: json || text });
          errors.push({ variation: i + 1, status: resp.status, error: json || text });
          continue; // Try next variation
        }

        const result_url = pickUrl(json);
        if (!result_url) {
          console.error(`[aimlApi] No image returned for variation ${i + 1}:`, json);
          errors.push({ variation: i + 1, error: 'No image returned by provider', provider: json });
          continue; // Try next variation
        }

        results.push(result_url);
        console.log(`[aimlApi] variation ${i + 1} success:`, { result_url: result_url.substring(0, 50) + '...' });

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error(`[aimlApi] timeout for variation ${i + 1} after 30s`);
          errors.push({ variation: i + 1, error: 'Request timeout' });
        } else {
          console.error(`[aimlApi] fetch error for variation ${i + 1}:`, fetchError);
          errors.push({ variation: i + 1, error: fetchError.message });
        }
        continue; // Try next variation
      }
    }

    // Check if we got at least one successful result
    if (results.length === 0) {
      console.error('[aimlApi] All variations failed:', errors);
      return bad(502, { 
        error: 'All variations failed to generate', 
        variations_attempted: num_variations,
        errors: errors.slice(0, 3) // Limit error details
      });
    }

    console.log(`[aimlApi] completed ${results.length}/${num_variations} variations successfully`);

    // CHARGE CREDITS - Only after successful generation (charge per successful variation)
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
        // 2) Insert credit charge (1 credit per successful variation)
        const creditsToCharge = results.length;
        const { error: chargeErr } = await supabaseAdmin
          .from('credits_ledger')
          .insert({
            user_id: userId,
            amount: creditsToCharge,
            reason: `i2i_generate_${creditsToCharge}_variations`,
            request_id: request_id,
            env: APP_ENV
          });

        if (chargeErr) {
          console.error('[aimlApi] charge credits failed:', chargeErr);
          // Don't fail the generation response; just log the charging error
        } else {
          console.log(`[aimlApi] charged ${creditsToCharge} credits for user:`, userId);
        }
      } else {
        console.log('[aimlApi] credits already charged for request_id:', request_id);
      }
    } catch (chargeError) {
      console.error('[aimlApi] credit charging error:', chargeError);
      // Don't fail the generation response; just log the charging error
    }

    // Return result with both new+legacy keys for compatibility
    const primaryResult = results[0]; // First result for legacy compatibility
    return ok({ 
      success: true,
      result_url: primaryResult, 
      image_url: primaryResult, // Legacy compatibility
      result_urls: results, // Array format with all variations
      variations_generated: results.length,
      variations_requested: num_variations,
      request_id,
      user_id: userId,
      env: APP_ENV,
      model: payload.model,
      mode: body.mode || 'i2i',
      // Include mode metadata for tracking and display
      ...(body.modeMeta && { modeMeta: body.modeMeta }),
      // Include any errors for debugging (but don't fail the request)
      ...(errors.length > 0 && { partial_errors: errors.slice(0, 3) }),
      postprocess: {
        recommended_usm: { radius: 0.9, amount: 1.0, threshold: 3 } // tiny radius, no halos
      }
    });
  } catch (e: any) {
    console.error('[aimlApi] unexpected error:', e);
    return bad(500, e?.message || 'aimlApi crashed');
  }
};


