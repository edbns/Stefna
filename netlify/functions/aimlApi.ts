// aimlApi.ts
import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const AIML_BASE = 'https://api.aimlapi.com';
const AIML_KEY  = process.env.AIML_API_KEY!;

type Family = 'neotokyo' | 'ghibli' | 'emotion' | 'none' | 'unknown';
type Policy = { min: number; max: number; def: number; family: Family };

const ENDPOINTS = ['/v1/images', '/images']; // try v1, then legacy
const HEADERS = (key: string) => ({
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
});

// --- Global policy (Flux needs higher denoise than SD to avoid passthrough)
function classifyFamily(presetId = '', prompt = ''): Policy {
  const t = `${presetId} ${prompt}`.toLowerCase();
  if (/neo[_\s-]?tokyo|visor|hud|neon|scanline|tattoo|circuit|rgb split|vhs/.test(t))
    return { min: 0.20, max: 0.30, def: 0.24, family: 'neotokyo' };
  if (/^rx_|tears|sparkle|shock|anime/.test(t))
    return { min: 0.12, max: 0.18, def: 0.14, family: 'ghibli' };
  if (/joy|sadness|nostalgia|distance|peace|fear|confidence|loneliness|vulnerability/.test(t))
    return { min: 0.10, max: 0.15, def: 0.12, family: 'emotion' };
  if (presetId === 'none')
    return { min: 0.00, max: 0.00, def: 0.00, family: 'none' };
  // Custom prompt safe default
  return { min: 0.12, max: 0.22, def: 0.16, family: 'unknown' };
}

function clamp(s: any, pol: Policy) {
  const n = Number(s);
  const v = Number.isFinite(n) ? n : pol.def;
  return Math.max(pol.min, Math.min(pol.max, v));
}

// Some providers 404 on '/image-to-image' suffix in model name.
function normalizeModel(model: string) {
  if (!model) return 'flux/dev';
  if (model.startsWith('flux/')) {
    return model.replace(/\/image-to-image$/i, ''); // 'flux/dev/image-to-image' -> 'flux/dev'
  }
  return model;
}

async function callAIML(path: string, payload: any) {
  const res = await fetch(`${AIML_BASE}${path}`, {
    method: 'POST',
    headers: HEADERS(AIML_KEY),
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { res, text, json };
}

export const handler: Handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const req = JSON.parse(event.body || '{}');

    const presetId  = String(req.presetId || '');
    const modelIn   = String(req.model || 'flux/dev'); // default Flux
    const prompt    = String(req.prompt || '');
    const image_url = String(req.image_url || '');

    // Policy by family (Flux-aware)
    const isFlux = modelIn.startsWith('flux/');
    const pol    = isFlux ? classifyFamily(presetId, prompt)
                          : { min: 0.06, max: 0.10, def: 0.08, family: 'unknown' as Family };

    let model    = normalizeModel(modelIn);
    let strength = clamp(req.strength, pol);

    // Log strength policy for debugging
    console.log('🎯 Strength policy:', { presetId, family: pol.family, min: pol.min, max: pol.max, used: strength });

    // Minimal, AIML-supported payload ONLY
    const basePayload = {
      model,
      prompt,
      image_url,
      strength,
      num_variations: 1 as const,
    };

    // -------- try endpoints (and remap model if 404) ----------
    let lastErr = '';
    let result: any = null;

    for (const path of ENDPOINTS) {
      // 1st attempt with as-is normalized model
      let { res, json, text } = await callAIML(path, basePayload);
      if (res.ok) { result = json; break; }
      lastErr = `(${res.status}) ${text || res.statusText}`;

      // If 404/400, try model alias fallback once (Flux only)
      if ((res.status === 404 || res.status === 400) && isFlux && /\/image-to-image$/i.test(modelIn)) {
        const aliasPayload = { ...basePayload, model: normalizeModel(modelIn) }; // already normalized, but safe
        const r2 = await callAIML(path, aliasPayload);
        if (r2.res.ok) { result = r2.json; model = aliasPayload.model; break; }
        lastErr = `alias ${path} -> (${r2.res.status}) ${r2.text || r2.res.statusText}`;
      }
      // try next path
    }

    if (!result?.images?.[0]?.url) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `AIML call failed ${lastErr}` }),
      };
    }

    // Heuristic "no-op" guard: if inference is extremely fast AND family not 'none', bump once
    const inference = Number(result?.timings?.inference ?? 0);
    const canBump = isFlux && pol.family !== 'none' && strength < pol.max;
    if (canBump && inference > 0 && inference < 0.5) {
      const bumped = Math.min(pol.max, strength + 0.04);
      if (bumped > strength) {
        strength = bumped;
        const retryPayload = { ...basePayload, strength };
        // Re-use last successful path
        const retry = await callAIML(ENDPOINTS[0], retryPayload);
        if (retry.res.ok && retry.json?.images?.[0]?.url) {
          result = retry.json;
          console.log('🔄 Strength bumped from', strength - 0.04, 'to', strength, 'due to fast inference');
        }
      }
    }

    const outUrl = result.images[0].url;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        image_urls: [outUrl],
        model,
        prompt,
        variations_generated: 1,
        strength_used: strength,
        family: pol.family,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: String(err?.message || err) }),
    };
  }
};


