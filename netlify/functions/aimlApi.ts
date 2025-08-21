// netlify/functions/aimlApi.ts
import type { Handler } from '@netlify/functions';

type Mode = 'custom' | 'preset' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch' | 'none';

const AIML_BASE = 'https://api.aimlapi.com';

// Model fallback chain - try each model until one succeeds
const MODEL_FALLBACK_CHAIN = [
  'flux/dev',           // Primary: standard Flux
  'flux-pro/v1.1-ultra', // Secondary: premium Flux Pro
  'flux-realism',       // Tertiary: Flux Realism variant
  'dall-e-3'            // Final: DALL-E 3 as last resort
];

// flux/dev is the correct model name to use with AIML for i2i
function normalizeModel(model?: string) {
  if (!model) return 'flux/dev';
  // collapse any ".../image-to-image" suffix variants to "flux/dev"
  if (/^flux\/dev/i.test(model)) return 'flux/dev';
  return model;
}

// server-side strength policy (Flux needs higher denoise than SD to avoid passthrough)
const STRENGTH: Record<Mode, { min: number; def: number; max: number }> = {
  custom:         { min: 0.14, def: 0.18, max: 0.24 },
  preset:         { min: 0.12, def: 0.16, max: 0.22 },
  emotionmask:    { min: 0.10, def: 0.12, max: 0.15 },
  ghiblireact:    { min: 0.12, def: 0.14, max: 0.18 },
  neotokyoglitch: { min: 0.20, def: 0.24, max: 0.30 },
  none:           { min: 0.00, def: 0.00, max: 0.00 },
};

function clamp(val: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, val));
}

// Global identity prelude (kills duplicate/mirror/diptych + anime bleed)
const IDENTITY_PRELUDE = `Render the INPUT PHOTO as a single, continuous frame of ONE subject.
Do NOT create a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame.
Do NOT duplicate, mirror, overlay, or repeat any part of the face or body.
Preserve identity exactly: same gender, skin tone, ethnicity, age, and facial structure.`;

const GHIBLI_FACE_ONLY = `Apply changes on the FACE ONLY; hair, body, clothing, and background remain photorealistic and unchanged.
Allow light, face-only anime micro-stylization (catchlights/tiny highlights). Avoid outlines and cel-shading. No skin recolor.`;

async function postAIML(path: string, token: string, body: any) {
  const res = await fetch(`${AIML_BASE}${path}`, {
    method: 'POST',
    headers: {
      'authorization': token,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res;
}

export const handler: Handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'METHOD_NOT_ALLOWED' }) };
    }

    const auth = event.headers['authorization'] || event.headers['Authorization'];
    if (!auth) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'NO_AUTH' }) };
    }

    const raw = JSON.parse(event.body || '{}');

    const mode: Mode = raw.mode;
    const userPrompt: string = (raw.prompt || '').toString();
    const image_url: string = (raw.image_url || '').toString();
    const requestedStrength: number = Number(raw.strength);
    const num_variations: number = Number(raw.num_variations || 1);

    // basic validation
    if (!mode || !['custom','preset','emotionmask','ghiblireact','neotokyoglitch','none'].includes(mode)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'INVALID_MODE' }) };
    }
    if (!image_url) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'NO_IMAGE_URL' }) };
    }

    // normalize model and strength per-mode
    const requestedModel = normalizeModel(raw.model);
    const policy = STRENGTH[mode];
    const strength = clamp(
      isFinite(requestedStrength) ? requestedStrength : policy.def,
      policy.min,
      policy.max
    );

    // build final prompt (server always injects identity prelude)
    const prelude = mode === 'ghiblireact'
      ? `${IDENTITY_PRELUDE}\n${GHIBLI_FACE_ONLY}`
      : IDENTITY_PRELUDE;

    const prompt = `${prelude}\n${userPrompt || ''}`.trim();

    // Try endpoints and models in sequence until one succeeds
    const ENDPOINTS = ['/v1/images', '/images'];
    let lastError = '';
    let result: any = null;
    let successfulModel = '';
    let used_fallback_model = false;
    let fallback_reason = null;

    // Try each model in the fallback chain
    for (const model of MODEL_FALLBACK_CHAIN) {
      console.log(`🎯 Trying model: ${model}`);
      
      // Build payload for this model
      const aimlPayload = {
        model,
        prompt,
        image_url,
        strength,
        num_variations,
      };

      // Try each endpoint for this model
      for (const path of ENDPOINTS) {
        try {
          const { res, json, text } = await tryEndpoint(path, auth, aimlPayload);
          
          if (res.ok && json?.images?.[0]?.url) {
            result = json;
            successfulModel = model;
            used_fallback_model = model !== MODEL_FALLBACK_CHAIN[0];
            fallback_reason = used_fallback_model ? `Primary model failed, ${model} succeeded` : null;
            
            console.log(`✅ Success with model: ${model} on endpoint: ${path}`);
            break;
          } else {
            lastError = `(${res.status}) ${text || res.statusText}`;
            console.log(`❌ Model ${model} failed on ${path}: ${lastError}`);
          }
        } catch (error: any) {
          lastError = `Error: ${error.message}`;
          console.log(`❌ Model ${model} error on ${path}: ${lastError}`);
        }
      }
      
      // If we got a successful result, break out of model loop
      if (result) break;
    }

    // Helper function to try an endpoint
    async function tryEndpoint(path: string, auth: string, payload: any) {
      let res = await postAIML(path, auth, payload);
      if (res.status === 404) res = await postAIML(path === '/v1/images' ? '/images' : '/v1/images', auth, payload);
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch { /* leave text in */ }
      return { res, json, text };
    }

    if (!result?.images?.[0]?.url) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: `All models failed. Last error: ${lastError}` }),
      };
    }

    // No-op guard: if inference is suspiciously fast (<0.5s), bump strength once (+0.04) and retry
    const inference = Number(result?.timings?.inference ?? 0);
    const canBump = successfulModel.startsWith('flux') && strength < policy.max;
    let had_retry = false;
    
    if (canBump && inference > 0 && inference < 0.5) {
      const bumped = clamp(strength + 0.04, policy.min, policy.max);
      const retryPayload = { 
        model: successfulModel,
        prompt,
        image_url,
        strength: bumped,
        num_variations,
      };
      
      // Retry with the successful model and endpoint
      const retry = await postAIML('/v1/images', auth, retryPayload);
      if (retry.status === 404) {
        const retry2 = await postAIML('/images', auth, retryPayload);
        if (retry2.ok) {
          const retryJson = await retry2.json().catch(() => ({}));
          if (retryJson?.images?.[0]?.url) {
            result = retryJson;
            had_retry = true;
            console.log('🔄 Strength bumped from', strength, 'to', bumped, 'due to fast inference');
          }
        }
      } else if (retry.ok) {
        const retryJson = await retry.json().catch(() => ({}));
        if (retryJson?.images?.[0]?.url) {
          result = retryJson;
          had_retry = true;
          console.log('🔄 Strength bumped from', strength, 'to', bumped, 'due to fast inference');
        }
      }
    }

    // Normalize response to your client shape
    const imageUrls: string[] =
      result?.image_urls ??
      (Array.isArray(result?.images) ? result.images.map((i: any) => i.url).filter(Boolean) : []);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        image_urls: imageUrls,
        model: successfulModel,
        prompt,
        variations_generated: imageUrls.length || num_variations,
        strength_used: strength,
        strength_requested: requestedStrength,
        had_retry,
        used_fallback_model,
        fallback_reason,
        image_url: imageUrls[0] || null,
        timings: result?.timings ?? null,
      }),
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store',
      },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'SERVER_ERROR', message: err?.message }),
    };
  }
};


