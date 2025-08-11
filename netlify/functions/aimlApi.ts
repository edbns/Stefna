// Minimal I2I-only images endpoint with clear errors
const pickUrl = (j: any) =>
  j?.images?.[0]?.url ?? j?.data?.[0]?.url ?? j?.videos?.[0]?.url ?? j?.result_url ?? null;

const bad = (s: number, m: any) => ({
  statusCode: s,
  body: typeof m === 'string' ? JSON.stringify({ error: m }) : JSON.stringify(m),
});

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export const handler = async (event: any) => {
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
    if (!image_url || !/^https?:\/\//i.test(image_url) || image_url.includes('...')) {
      return bad(400, 'image_url must be a full https URL (no "...")');
    }

    const payload = {
      model: 'flux/dev/image-to-image',
      prompt: String(body.prompt || 'stylize').trim(),
      image_url,
      strength: clamp(Number(body.strength ?? 0.75), 0.4, 0.95),
      num_inference_steps: Math.round(clamp(Number(body.num_inference_steps ?? body.steps ?? 36), 1, 150)),
      guidance_scale: Number.isFinite(body.guidance_scale) ? body.guidance_scale : 7.5,
    };

    // Call AIML
    const resp = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AIML_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let json: any = null; try { json = JSON.parse(text); } catch {}

    if (!resp.ok) {
      // Bubble up provider details (400/401/etc) so the UI can show real reason
      return bad(resp.status, json || text || { error: 'AIML error' });
    }

    const result_url = pickUrl(json);
    if (!result_url) return bad(502, { error: 'No image returned by provider', provider: json });

    // --- OPTIONAL: enable autosave after Stage A is green ---
    // if (event.headers.authorization && body.user_id) {
    //   const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
    //   if (isUuid(body.user_id) && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    //     const { createClient } = await import('@supabase/supabase-js');
    //     const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    //     const row = {
    //       job_id: body.job_id ?? null,
    //       user_id: body.user_id,
    //       result_url,
    //       source_url: body.source_url ?? null,
    //       model: payload.model,
    //       mode: 'i2i',
    //       prompt: payload.prompt,
    //       negative_prompt: body.negative_prompt ?? null,
    //       strength: payload.strength,
    //       visibility: 'private',
    //       env: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
    //       allow_remix: false,
    //       parent_asset_id: body.parent_asset_id ?? null,
    //     };
    //     const upsert = row.job_id
    //       ? supa.from('media_assets').upsert(row, { onConflict: 'job_id', ignoreDuplicates: true }).select().maybeSingle()
    //       : supa.from('media_assets').insert(row).select().single();
    //     const { data, error } = await upsert;
    //     if (!error && data) {
    //       return { statusCode: 200, body: JSON.stringify({ result_url, saved: data, job_id: row.job_id ?? null }) };
    //     }
    //   }
    // }
    // -------------------------------------------------------

    return { statusCode: 200, body: JSON.stringify({ result_url }) };
  } catch (e: any) {
    return bad(500, e?.message || 'aimlApi crashed');
  }
};

