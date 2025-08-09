const { verifyAuth } = require("./_auth");

const httpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

exports.handler = async (event) => {
  const startTime = Date.now();
  try {
    const { userId } = verifyAuth(event);
    const body = JSON.parse(event.body || "{}");
    
    // Extract tracking fields
    const { jobId, presetName, source = "preset" } = body;
    console.log("Server received jobId:", jobId);

    const isI2I = !!body.image_url;
    if (isI2I && !httpUrl(body.image_url)) {
      return { statusCode: 400, body: JSON.stringify({ message: "image_url must be a public https URL (Cloudinary). Got non-fetchable value." }) };
    }

    const mode  = isI2I ? "i2i" : "t2i";
    const model = isI2I ? "flux/dev/image-to-image" : "stable-diffusion-v35-large";
    
    const size =
      Number.isFinite(body?.width) && Number.isFinite(body?.height)
        ? `${body.width}x${body.height}`
        : undefined;

    const payload = {
      model,
      prompt: body.prompt,
      negative_prompt: body.negative_prompt,
      steps: body.steps ?? 40,
      guidance_scale: body.guidance_scale ?? 7.5,
      ...(isI2I
        ? {
            image_url: body.image_url,
            ...(size ? { size } : {}),        // <-- only if present
            strength: body.strength ?? 0.85,
          }
        : {}),
    };

    const url = `${process.env.AIML_API_URL}/v1/images/generations`;
    
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

    const result_url =
      out.images?.[0]?.url || out.data?.[0]?.url ||
      out.data?.image_url || out.image_url || null;

    const duration = Date.now() - startTime;
    
    // Telemetry: Log generation metrics
    console.log(`GENERATION: userId=${userId}, source=${source || "custom"}, mode=${mode}, strength=${payload.strength}, size=${payload.size || `${body.width}x${body.height}`}, status=success, ms=${duration}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        result_url,
        source_url: isI2I ? body.image_url : null,
        echo: { 
          jobId,                 // <-- echo back EXACTLY what client sent
          source,
          presetName,
          mode, 
          model, 
          userId,
          strength: payload.strength, 
          size: payload.size || `${body.width}x${body.height}`
        }
      })
    };
  } catch (e) {
    const duration = Date.now() - startTime;
    const body = JSON.parse(event.body || "{}");
    const { source } = body;
    
    // Telemetry: Log error metrics
    console.log(`GENERATION: userId=${e.userId || "unknown"}, source=${source || "custom"}, mode=unknown, status=error, ms=${duration}, error=${e.message}`);
    console.error("aimlApi error:", e);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal error" }) };
  }
}; 