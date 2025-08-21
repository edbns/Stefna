// netlify/functions/aimlApi.ts
import type { Handler } from '@netlify/functions';

type Mode = 'custom' | 'preset' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch' | 'none';

const AIML_BASE = 'https://api.aimlapi.com';

// flux/dev is the correct model name to use with AIML for i2i
function normalizeModel(model?: string) {
  if (!model) return 'flux/dev';
  // collapse any ".../image-to-image" suffix variants to "flux/dev"
  if (/^flux\/dev/i.test(model)) return 'flux/dev';
  return model;
}

// server-side strength policy (Flux likes ~0.12–0.30 to be noticeable)
const STRENGTH: Record<Mode, { min: number; def: number; max: number }> = {
  custom:         { min: 0.12, def: 0.16, max: 0.22 },
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
    const model = normalizeModel(raw.model);
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

    // Only forward supported fields
    const aimlPayload = {
      model,
      prompt,
      image_url,
      strength,
      num_variations,
    };

    // Try /v1/images then /images (some providers differ)
    const tryOnce = async () => {
      let res = await postAIML('/v1/images', auth, aimlPayload);
      if (res.status === 404) res = await postAIML('/images', auth, aimlPayload);
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch { /* leave text in */ }
      return { res, json, text };
    };

    let { res, json } = await tryOnce();

    // No-op guard: if inference is suspiciously fast (<0.5s), bump strength once (+0.04) and retry
    let had_retry = false;
    if (res.ok && json?.timings?.inference != null && json.timings.inference < 0.5 && strength < policy.max) {
      const bumped = clamp(strength + 0.04, policy.min, policy.max);
      const retryPayload = { ...aimlPayload, strength: bumped };
      let res2 = await postAIML('/v1/images', auth, retryPayload);
      if (res2.status === 404) res2 = await postAIML('/images', auth, retryPayload);
      const text2 = await res2.text();
      let json2: any = {};
      try { json2 = JSON.parse(text2); } catch {}
      if (res2.ok) {
        res = res2; json = json2; had_retry = true;
      }
    }

    if (!res.ok) {
      const status = res.status;
      const reason = json?.error || json || 'AIML_ERROR';
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: `AIML_${status}`, reason }),
      };
    }

    // Normalize response to your client shape
    const imageUrls: string[] =
      json?.image_urls ??
      (Array.isArray(json?.images) ? json.images.map((i: any) => i.url).filter(Boolean) : []);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        image_urls: imageUrls,
        model,
        prompt,
        variations_generated: imageUrls.length || num_variations,
        strength_used: strength,
        strength_requested: requestedStrength,
        had_retry,
        used_fallback_model: false,
        fallback_reason: null,
        image_url: imageUrls[0] || null,
        timings: json?.timings ?? null,
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


