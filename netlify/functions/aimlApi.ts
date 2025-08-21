// netlify/functions/aimlApi.ts
import type { Handler } from '@netlify/functions';

type Mode = 'custom' | 'preset' | 'emotionmask' | 'ghiblireact' | 'neotokyoglitch';

// Lock to the correct AIML endpoint
const AIML_BASE = 'https://api.aimlapi.com';
const AIML_ROUTE = '/v1/images/generations'; // ✅ the only valid route
const AIML_URL = `${AIML_BASE}${AIML_ROUTE}`;

// Input you accept from client
type InBody = {
  model: string;          // e.g. 'flux/dev/image-to-image'
  prompt: string;
  image_url?: string;     // URL you upload to Cloudinary sources bucket
  strength?: number;      // 0..1
  num_variations?: number;// integer
  mode?: Mode;
};

// Server-only identity prelude (inject once)
const IDENTITY_PRELUDE =
  "Render the INPUT PHOTO as a single, continuous frame. Show ONE instance of the same subject. " +
  "Do NOT compose a grid, collage, split-screen, diptych, mirrored panel, border, seam, gutter, or frame. " +
  "Do NOT duplicate, mirror, or repeat any part of the face. Keep the original camera crop and background. " +
  "Preserve the person's identity exactly: same gender, skin tone, ethnicity, age, and facial structure. ";

function buildFinalPrompt(mode: Mode, userPrompt: string) {
  // Add mode-specific constraints (short + additive)
  const modeClamp =
    mode === 'ghiblireact' ? "Face-only micro-stylization; body/background remain photorealistic. "
  : mode === 'emotionmask' ? "Modify micro-expressions only; no geometry or skin tone changes. "
  : mode === 'neotokyoglitch' ? "Additive overlays only; no facial geometry changes. "
  : "";

  return (IDENTITY_PRELUDE + modeClamp + (userPrompt || "")).trim();
}

// Strength clamp (server as source of truth)
const STRENGTH_POLICY = {
  custom:        { min: 0.14, def: 0.18, max: 0.24 },
  preset:        { min: 0.12, def: 0.16, max: 0.22 },
  emotionmask:   { min: 0.10, def: 0.12, max: 0.15 },
  ghiblireact:   { min: 0.12, def: 0.14, max: 0.18 },
  neotokyoglitch:{ min: 0.20, def: 0.24, max: 0.30 },
} as const;

function clampStrength(mode: Mode, requested?: number) {
  const p = STRENGTH_POLICY[mode];
  if (requested == null) return p.def;
  return Math.min(p.max, Math.max(p.min, requested));
}

// Model sanity (Flux i2i must be an i2i model id)
function normalizeModel(model: string, hasImage: boolean) {
  if (hasImage) {
    if (model === 'flux/dev') return 'flux/dev/image-to-image';
    // Allow your other Flux variants here if needed…
  }
  return model;
}

// Map your allowed fields → AIML payload
function toAIMLPayload(b: InBody, finalPrompt: string, strength: number) {
  return {
    model: b.model,
    prompt: finalPrompt,
    image: b.image_url,              // ✅ AIML expects "image" (URL or base64)
    strength,                        // ✅ denoising strength for i2i
    n: Math.max(1, b.num_variations ?? 1),  // ✅ AIML expects "n"
  };
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
    if (!mode || !['custom','preset','emotionmask','ghiblireact','neotokyoglitch'].includes(mode)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'INVALID_MODE' }) };
    }
    if (!image_url) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'NO_IMAGE_URL' }) };
    }

    // normalize model and strength per-mode
    const requestedModel = normalizeModel(raw.model, !!image_url);
    const strength = clampStrength(mode, requestedStrength);

    // build final prompt (server always injects identity prelude)
    const finalPrompt = buildFinalPrompt(mode, userPrompt);

    // Single POST to the correct endpoint
    try {
      // Build AIML payload
      const aimlPayload = toAIMLPayload({ 
        model: requestedModel, 
        prompt: finalPrompt, 
        image_url, 
        num_variations 
      }, finalPrompt, strength);

      console.log('🎯 Sending to AIML:', {
        url: AIML_URL,
        payload: aimlPayload,
        mode,
        strength
      });

      // Single POST with good error messages (no oscillating fallbacks)
      const res = await fetch(AIML_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aimlPayload)
      });

      if (!res.ok) {
        const text = await res.text().catch(()=>'');
        // Helpful server-side log
        console.error('AIML error', {
          url: AIML_URL,
          status: res.status,
          statusText: res.statusText,
          bodySent: aimlPayload,
          responseText: text?.slice(0, 4000),
        });
        // Surface a concise error to client
        return {
          statusCode: 502,
          body: JSON.stringify({
            ok: false,
            error: `AIML_${res.status}`,
            detail: 'Images endpoint must be /v1/images/generations; check model id and payload keys.',
          }),
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'access-control-allow-origin': '*',
          },
        };
      }

      // Parse response & smart retry for "too-similar"
      type AIMLResponse = {
        images?: { url: string }[];
        timings?: { inference?: number };
        seed?: number;
        // ...other fields the API returns
      };

      const data = await res.json() as AIMLResponse;
      const urls = (data.images ?? []).map(x => x.url).filter(Boolean);

      // Optional retry: if "pass-through", bump strength once
      if (!urls.length || (data.timings?.inference ?? 0) < 0.35) {
        const bump = Math.min(0.06, STRENGTH_POLICY[mode].max - strength);
        if (bump > 0) {
          console.log('🔄 Retrying with bumped strength:', strength + bump);
          const retry = { ...aimlPayload, strength: strength + bump };
          const r = await fetch(AIML_URL, { 
            method: 'POST', 
            headers: {
              'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
              'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(retry) 
          });
          const d = await r.json() as AIMLResponse;
          const u = (d.images ?? []).map(x => x.url).filter(Boolean);
          if (u.length) {
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                ok: true, 
                image_urls: u, 
                model: retry.model, 
                strength_used: retry.strength,
                had_retry: true,
                prompt: finalPrompt,
                variations_generated: u.length,
                image_url: u[0] || null,
              }),
              headers: {
                'content-type': 'application/json; charset=utf-8',
                'access-control-allow-origin': '*',
                'cache-control': 'no-store',
              },
            };
          }
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          ok: true, 
          image_urls: urls, 
          model: aimlPayload.model, 
          strength_used: strength,
          had_retry: false,
          prompt: finalPrompt,
          variations_generated: urls.length,
          image_url: urls[0] || null,
        }),
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*',
          'cache-control': 'no-store',
        },
      };

    } catch (error: any) {
      console.error('❌ AIML request failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          ok: false, 
          error: 'AIML_REQUEST_FAILED',
          detail: error?.message || 'Unknown error occurred'
        }),
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*',
        },
      };
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'SERVER_ERROR', message: err?.message }),
    };
  }
};


