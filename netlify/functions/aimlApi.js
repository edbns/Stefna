const { verifyAuth } = require("./_auth");
const { createClient } = require('@supabase/supabase-js');

const httpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

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
    const body = JSON.parse(event.body || "{}");
    
    // Extract required fields
    const { prompt, source_url, steps, strength, resource_type, jobId, presetName, source = "custom" } = body;
    
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

    // Determine resource type and build payload
    const resourceType = resource_type === 'video' ? 'video' : 'image';
    
    // Build payload based on resource type
    const common = {
      prompt: (prompt && String(prompt).trim()) || 'beautiful artwork',
      negative_prompt: body.negative_prompt || 'photorealistic, realistic, film grain, camera, lens, watermark, frame, border, text, caption, vignette',
      guidance_scale: body.guidance_scale ?? 7.5,
      num_inference_steps: steps ?? 36,
    };

    let endpoint, payload;
    
    if (resourceType === 'image') {
      endpoint = '/v1/images/generations';
      payload = {
        ...common,
        model: 'flux/dev/image-to-image',
        image_url: source_url,
        strength: Math.min(Math.max(strength ?? 0.7, 0.4), 0.9),
      };
    } else {
      // VIDEO-TO-VIDEO
      endpoint = '/v1/videos/edits';
      payload = {
        ...common,
        model: 'video/dev/video-to-video', // placeholder model name; use your actual one
        video_url: source_url,              // some providers still use "input_url"
        strength: Math.min(Math.max(strength ?? 0.7, 0.4), 0.9),
      };
    }

    const url = `${process.env.AIML_API_URL}${endpoint}`;
    
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

    // Auto-save the generated media to database
    try {
      const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      const row = {
        user_id: userId,
        result_url: result_url,
        source_url: source_url,
        job_id: jobId || null,
        model: payload.model || null,
        mode: resourceType === 'video' ? 'v2v' : 'i2i',
        prompt: prompt || 'beautiful artwork',
        negative_prompt: body.negative_prompt || 'photorealistic, realistic, film grain, camera, lens, watermark, frame, border, text, caption, vignette',
        width: body.width || null,
        height: body.height || null,
        strength: payload.strength || null,
        visibility: 'private',      // default private → user's profile only
        env: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
        allow_remix: false,         // user can flip this later
        parent_asset_id: null       // set when this was a remix; else null
      };

      const { data: saved, error } = await supa.from('media_assets').insert(row).select().single();
      if (error) {
        console.error('Auto-save failed:', error);
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