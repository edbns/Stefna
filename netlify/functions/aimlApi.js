const { verifyAuth } = require("./_auth");
const { createClient } = require('@supabase/supabase-js');

const httpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

// Clamp number between min and max values
function clamp(n, lo, hi) { 
  return Math.min(Math.max(n, lo), hi); 
}

// Backend-side presets to ensure full prompt context when a preset is used
// Mirrors src/config/freeMode.ts but simplified for server use
const PRESETS = {
  "Oil Painting": {
    prompt: "oil painting style, thick brush strokes, canvas texture, preserve subject and composition, keep same person and pose, do not change age or gender",
    negative: "frame, border, gallery wall, flowers, vase, watermark, text, logo, polaroid, photo frame, vignette, black and white, different person, child, baby, boy, girl, face swap, age change"
  },
  "Cyberpunk": {
    prompt: "neon lighting, high-contrast cyberpunk color grading, chrome highlights, retain original subject, keep same person and pose, do not change age or gender",
    negative: "monochrome, grayscale, frame, border, vignette, polaroid, text, caption, watermark, different person, child, baby, boy, girl, face swap, age change",
    strength: 0.75
  },
  "Studio Ghibli": {
    prompt: "ghibli-inspired soft shading, gentle color palette, clean lines, keep same subject and pose, do not change age or gender",
    negative: "photorealistic, realistic skin, film grain, camera, lens, watermark, frame, border, text, caption, vignette, different person, child, baby, boy, girl, face swap, age change",
    strength: clamp(0.9, 0.85, 0.95)
  },
  "Photorealistic": {
    prompt: "highly detailed photographic style, natural texture, realistic lighting, keep original composition",
    negative: "painting, illustration, frame, border, oversharpened, watermark, cartoon, anime, polaroid, film frame, vignette",
    strength: clamp(0.55, 0.45, 0.65)
  },
  "Watercolor": {
    prompt: "watercolor painting style, soft washes, paper texture, preserve subject and composition",
    negative: "frame, border, gallery wall, extra objects, text, watermark, digital artifacts, polaroid, photo frame, vignette"
  },
  "Anime Dream": {
    prompt: "anime style, clean outlines, vibrant shading, maintain original subject and pose, do not change age or gender",
    negative: "photorealistic, realistic, film grain, camera, lens, watermark, frame, border, text, caption, vignette, subtitles, logo, realistic photography, polaroid, photo frame, black and white, different person, child, baby, boy, girl, face swap, age change",
    strength: clamp(0.9, 0.85, 0.95)
  },
  "Test Transform": {
    prompt: "convert to black and white, strong contrast, dramatic lighting",
    negative: "frame, border, vignette, watermark, text, color, colorful"
  },
  "Custom Transform": {
    prompt: "transform image style while keeping same subject and pose, do not change age or gender",
    negative: "photorealistic, realistic skin, film grain, frame, border, watermark, text, caption, different person, child, baby, boy, girl, face swap, age change",
    strength: 0.85
  }
}

// Convert client request to proper I2I payload for AIML API
function toI2IPayload(req) {
  if (!req.source_url) throw new Error('source_url is required for image-to-image');

  return {
    model: 'flux/dev/image-to-image',
    prompt: String(req.prompt ?? '').trim() || 'stylize',
    negative_prompt: req.negative_prompt,
    image_url: req.source_url,
    strength: clamp(Number(req.strength ?? 0.75), 0.4, 0.95),
    num_inference_steps: Math.round(clamp(Number(req.steps ?? 36), 1, 150)),
    guidance_scale: Number.isFinite(req.guidance_scale) ? req.guidance_scale : 7.5,
  };
}

// Remove unsupported keys from client body (preset/remix paths)
function normalizeI2IRequest(raw) {
  const cleaned = { ...raw };
  delete cleaned.type;
  delete cleaned.quality;
  delete cleaned.style;
  delete cleaned.num_outputs;
  delete cleaned.width;        // I2I ignores size
  delete cleaned.height;
  if (cleaned.steps && !cleaned.num_inference_steps) {
    cleaned.num_inference_steps = cleaned.steps;
  }
  return cleaned;
}

// Log redaction for security (no secrets in request dumps)
function redact(o) {
  const s = JSON.stringify(o, (_k,v) =>
    typeof v === 'string' && v.startsWith('data:image') ? '[data-url]' :
    typeof v === 'string' && v.length > 100 ? v.slice(0,50) + '...[truncated]' :
    v
  );
  return s.length > 1200 ? s.slice(0,1200) + '…[truncated]' : s;
}

exports.handler = async (event) => {
  const startTime = Date.now();
  try {
    const { userId } = verifyAuth(event);
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    if (!isUuid(userId)) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Authentication required' }) }
    }
    const rawBody = JSON.parse(event.body || "{}");
    
    // Sanitize the request for I2I
    const body = normalizeI2IRequest(rawBody);
    
    // Extract required fields
    const { prompt, source_url, steps, strength, resource_type, jobId, presetName, source = "custom", visibility, allow_remix } = body;
    
    // Validate source_url is required
    if (!source_url) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ message: "source_url is required" }) 
      };
    }

    // Validate source_url is a public HTTPS URL
    if (!httpUrl(source_url)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ message: "source_url must be a public https URL (Cloudinary). Got non-fetchable value." }) 
      };
    }

    // If a preset is provided, expand to full prompt context on server
    let expanded = { ...body };
    if (presetName && PRESETS[presetName]) {
      const p = PRESETS[presetName];
      // Only set defaults; preserve user's edited prompt if provided
      if (!expanded.prompt || !String(expanded.prompt).trim()) {
        expanded.prompt = p.prompt;
      }
      if (!expanded.negative_prompt && p.negative) expanded.negative_prompt = p.negative;
      if (
        typeof p.strength === 'number' &&
        expanded.resource_type !== 'video' &&
        (expanded.strength === undefined || expanded.strength === null)
      ) {
        // Only apply preset strength for image i2i and when not supplied by client
        expanded.strength = p.strength;
      }
    }

    // Determine resource type and build payload
    const resourceType = expanded.resource_type === 'video' ? 'video' : 'image';
    
    let endpoint, payload;
    
    if (resourceType === 'image') {
      endpoint = '/v1/images/generations';
      // Use the sanitized I2I payload
      payload = toI2IPayload(expanded);
    } else {
      // VIDEO-TO-VIDEO
      endpoint = '/v1/videos/edits';
      payload = {
        model: 'video/dev/video-to-video', // placeholder model name; use your actual one
        prompt: (expanded.prompt && String(expanded.prompt).trim()) || 'beautiful artwork',
        negative_prompt: expanded.negative_prompt || 'photorealistic, realistic, film grain, camera, lens, watermark, frame, border, text, caption, vignette',
        guidance_scale: expanded.guidance_scale ?? 7.5,
        num_inference_steps: expanded.steps ?? 36,
        video_url: expanded.source_url,              // some providers still use "input_url"
        strength: Math.min(Math.max(expanded.strength ?? 0.7, 0.4), 0.9),
      };
    }

    const url = `${process.env.AIML_API_URL}${endpoint}`;

    // Quota enforcement: determine token cost and check server-side quota before calling provider
    const cost = resourceType === 'video' ? 5 : 2;
    try {
      const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      // Quota precheck (userId is guaranteed UUID above)
        const { data: precheck, error: preErr } = await supa.rpc('can_consume_tokens', { p_user_id: userId, p_cost: cost });
      if (preErr) {
        console.error('Quota precheck error:', preErr);
        return { statusCode: 500, body: JSON.stringify({ message: 'Quota check failed' }) };
      }
        const okRow = Array.isArray(precheck) ? precheck[0] : precheck;
        if (!okRow?.ok) {
          const reason = okRow?.reason || 'Quota exceeded';
          return { statusCode: 429, body: JSON.stringify({ message: reason, quota: okRow }) };
        }
    } catch (qe) {
      console.error('Quota check exception:', qe);
      return { statusCode: 500, body: JSON.stringify({ message: 'Quota check failed' }) };
    }
    
    // Retry logic for 4xx/5xx errors
    let r, out;
    let retryCount = 0;
    const maxRetries = 1;
    
    while (retryCount <= maxRetries) {
      try {
        r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type":"application/json", Authorization:`Bearer ${process.env.AIML_API_KEY}` },
          body: JSON.stringify(payload)
        });
        out = await r.json();
        
        if (r.ok) break; // Success, exit retry loop
        
        // Check if error is retryable (4xx/5xx from provider)
        if (retryCount < maxRetries && (r.status >= 400)) {
          retryCount++;
          const jitter = Math.random() * 1000; // 0-1s jitter
          console.log(`AIML API retry ${retryCount}/${maxRetries} after ${r.status} error, waiting ${jitter}ms`);
          await new Promise(resolve => setTimeout(resolve, jitter));
          continue;
        }
        
        // Return detailed error info to client
        console.error('GEN', JSON.stringify({ 
          userId, 
           source: source || "custom", 
          mode: resourceType === 'video' ? 'v2v' : 'i2i',
          error: out.message || `Provider error ${r.status}`,
          details: redact(out),
          ok: false, 
          ms: Date.now() - startTime 
        }));
        
        return {
          statusCode: r.status,
          body: JSON.stringify({ 
            message: out.message || `Provider error ${r.status}`, 
            details: out 
          })
        };
      } catch (fetchError) {
        if (retryCount < maxRetries) {
          retryCount++;
          const jitter = Math.random() * 1000;
          console.log(`AIML API retry ${retryCount}/${maxRetries} after fetch error, waiting ${jitter}ms`);
          await new Promise(resolve => setTimeout(resolve, jitter));
          continue;
        }
        // Return fetch error details to client
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            message: fetchError.message || "Network error", 
            details: { error: fetchError.toString() }
          })
        };
      }
    }

    // Get result URL using the updated pickResultUrl logic
    const result_url = out?.images?.[0]?.url ?? out?.videos?.[0]?.url ?? out?.data?.[0]?.url ?? out?.result_url ?? null;

    if (!result_url) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "No result URL in response" })
      };
    }

    // Auto-save the generated media to database and consume tokens
    try {
      const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      // Consume tokens after successful generation
      const { data: consumed, error: consumeErr } = await supa.rpc('consume_tokens', { p_user_id: userId, p_cost: cost, p_kind: resourceType });
      if (consumeErr || !consumed?.[0]?.ok) {
        console.error('Token consumption failed:', consumeErr || consumed);
        return { statusCode: 429, body: JSON.stringify({ message: 'Quota exceeded during finalize' }) };
      }
      
        const row = {
        user_id: userId,
        url: result_url,            // Required NOT NULL field - use result_url as the main URL
        result_url: result_url,
          source_url: expanded.source_url,
        job_id: jobId || null,
        model: payload.model || null,
        mode: resourceType === 'video' ? 'v2v' : 'i2i',
          prompt: (expanded.prompt && String(expanded.prompt).trim()) || 'beautiful artwork',
          negative_prompt: expanded.negative_prompt || 'photorealistic, realistic, film grain, camera, lens, watermark, frame, border, text, caption, vignette',
        width: null,                // I2I doesn't support width/height
        height: null,               // I2I doesn't support width/height
        strength: payload.strength || null,
         visibility: visibility === 'public' ? 'public' : 'private',
        env: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
         allow_remix: visibility === 'public' ? Boolean(allow_remix) : false,
        parent_asset_id: null,      // set when this was a remix; else null
        resource_type: resourceType, // Required NOT NULL field
        folder: 'users/' + userId,  // Required NOT NULL field
        bytes: null,
        duration: null,
        meta: {
          prompt: (expanded.prompt && String(expanded.prompt).trim()) || 'beautiful artwork',
          negative_prompt: expanded.negative_prompt || 'photorealistic, realistic, film grain, camera, lens, watermark, frame, border, text, caption, vignette',
          strength: payload.strength || null,
          model: payload.model || null,
          mode: resourceType === 'video' ? 'v2v' : 'i2i'
        }
      };

      const { data: saved, error } = await supa.from('media_assets').insert(row).select().single();
      if (error) {
        console.error('Auto-save failed:', error);
        console.error('Failed row data:', JSON.stringify(row, null, 2));
        // Don't fail the generation, just log the error
      }
      
      const duration = Date.now() - startTime;
      
      // Telemetry: Log generation metrics (structured)
      console.log("GEN", JSON.stringify({
        userId, 
        source: source || "custom", 
        mode: resourceType === 'video' ? 'v2v' : 'i2i',
        strength: payload.strength, 
        resourceType,
        ok: true, 
        ms: duration
      }));
      
      // Legacy telemetry: Log generation metrics (human readable)
      console.log(`GENERATION: userId=${userId}, source=${source || "custom"}, mode=${resourceType === 'video' ? 'v2v' : 'i2i'}, strength=${payload.strength}, resourceType=${resourceType}, status=success, ms=${duration}`);

      // Return the saved row to the client so UI can show it immediately
      return {
        statusCode: 200,
        body: JSON.stringify({
          saved,
          result_url,
          source_url,
          echo: { 
            jobId,                 // <-- echo back EXACTLY what client sent
            source,
            presetName,
            mode: resourceType === 'video' ? 'v2v' : 'i2i', 
            model: payload.model, 
            userId,
            strength: payload.strength, 
            resourceType
          }
        })
      };
    } catch (saveError) {
      console.error('Auto-save error:', saveError);
      // Don't fail the generation, just return the result without saving
      const duration = Date.now() - startTime;
      
      // Telemetry: Log generation metrics (structured)
      console.log("GEN", JSON.stringify({
        userId, 
        source: source || "custom", 
        mode: resourceType === 'video' ? 'v2v' : 'i2i',
        strength: payload.strength, 
        resourceType,
        ok: true, 
        ms: duration
      }));
      
      // Legacy telemetry: Log generation metrics (human readable)
      console.log(`GENERATION: userId=${userId}, source=${source || "custom"}, mode=${resourceType === 'video' ? 'v2v' : 'i2i'}, strength=${payload.strength}, resourceType=${resourceType}, status=success, ms=${duration}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          saved: null,
          result_url,
          source_url,
          echo: { 
            jobId,                 // <-- echo back EXACTLY what client sent
            source,
            presetName,
            mode: resourceType === 'video' ? 'v2v' : 'i2i', 
            model: payload.model, 
            userId,
            strength: payload.strength, 
            resourceType
          }
        })
      };
    }
  } catch (e) {
    const duration = Date.now() - startTime;
    const body = JSON.parse(event.body || "{}");
    const { source } = body;
    
    // Telemetry: Log error metrics (structured)
    console.log("GEN", JSON.stringify({
      userId: e.userId || "unknown", 
      source: source || "custom", 
      mode: "unknown",
      ok: false, 
      ms: duration,
      error: e.message
    }));
    
    // Legacy telemetry: Log error metrics (human readable)
    console.log(`GENERATION: userId=${e.userId || "unknown"}, source=${source || "custom"}, mode=unknown, status=error, ms=${duration}, error=${e.message}`);
    console.error("aimlApi error:", e);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal error" }) };
  }
}; 