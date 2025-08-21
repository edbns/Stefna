// aimlApi.ts (Netlify function)
import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const AIML_BASE = 'https://api.aimlapi.com';
const AIML_KEY  = process.env.AIML_API_KEY!;

type Family = 'neotokyo' | 'ghibli' | 'emotion' | 'none' | 'unknown';
type Policy = { min: number; max: number; def: number; family: Family };

function classify(presetId = '', prompt = ''): Policy {
  const t = `${presetId} ${prompt}`.toLowerCase();

  if (/neo[_\s-]?tokyo|visor|hud|neon|scanline|tattoo|circuit|rgb split|vhs/.test(t))
    return { min: 0.20, max: 0.30, def: 0.24, family: 'neotokyo' };

  if (/^rx_|tears|sparkle|shock|anime/.test(t))
    return { min: 0.12, max: 0.18, def: 0.14, family: 'ghibli' };

  if (/joy|sadness|nostalgia|distance|peace|fear|confidence|loneliness|vulnerability/.test(t))
    return { min: 0.10, max: 0.15, def: 0.12, family: 'emotion' };

  if (/^none$/.test(presetId))
    return { min: 0.00, max: 0.00, def: 0.00, family: 'none' };

  // Safe, visible default for Flux custom prompts
  return { min: 0.12, max: 0.22, def: 0.16, family: 'unknown' };
}

function clampStrength(reqStrength: unknown, pol: Policy) {
  const s = Number.isFinite(Number(reqStrength)) ? Number(reqStrength) : pol.def;
  return Math.max(pol.min, Math.min(pol.max, s));
}

async function aimlGenerate(payload: {
  model: string; prompt: string; image_url: string; strength: number; num_variations: 1;
}) {
  const res = await fetch(`${AIML_BASE}/v1/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIML_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`AIML ${res.status}`);
  return res.json() as Promise<any>;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const presetId   = String(body.presetId || '');       // used only for policy; NOT forwarded
    const modelReq   = String(body.model || 'flux/dev/image-to-image');
    const prompt     = String(body.prompt || '');
    const image_url  = String(body.image_url || '');

    // Model-aware policy: Flux needs higher denoise to avoid passthrough.
    const isFlux = modelReq.startsWith('flux/');
    const pol    = isFlux ? classify(presetId, prompt) : { min: 0.06, max: 0.10, def: 0.08, family: 'unknown' };

    let strength = clampStrength(body.strength, pol);

    // Build AIML-minimal payload (only allowed keys)
    const basePayload = {
      model: modelReq,
      prompt,
      image_url,
      strength,
      num_variations: 1 as const,
    };

    // 1st attempt
    let result = await aimlGenerate(basePayload);
    const imgUrl = result?.images?.[0]?.url;
    const inference = Number(result?.timings?.inference ?? 0);

    // Heuristic: Flux with very low inference time + low strength often means "too similar".
    const canBump = isFlux && strength < pol.max && pol.max > 0 && pol.family !== 'none';
    if (canBump && inference > 0 && inference < 0.5) {
      // bump once within bounds
      const bumped = Math.min(pol.max, strength + 0.04);
      if (bumped > strength) {
        strength = bumped;
        result = await aimlGenerate({ ...basePayload, strength });
      }
    }

    const outUrl = result?.images?.[0]?.url;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: !!outUrl,
        image_urls: outUrl ? [outUrl] : [],
        model: modelReq,
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


