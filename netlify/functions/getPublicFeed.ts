// netlify/functions/getPublicFeed.ts
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { initCloudinary, assertCloudinaryEnv } from './_cloudinary';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const handler: Handler = async (event) => {
  if (process.env.NO_DB_MODE !== 'true') {
    return { statusCode: 412, body: JSON.stringify({ ok:false, error:'NO_DB_MODE=false (DB mode disabled here)' }) };
  }

  try {
    assertCloudinaryEnv();
    const cloudinary = initCloudinary();

    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    const res = await cloudinary.search
      .expression('tags="stefna" AND tags="type:output" AND tags="public"')
      .sort_by('created_at','desc')
      .max_results(limit)
      .execute();

    const data = (res?.resources || []).map((r: any) => ({
      id: r.public_id,
      cloudinary_public_id: r.public_id,
      media_type: r.resource_type === 'video' ? 'video' : 'image',
      published_at: r.created_at,
      preset_key: r.context?.custom?.preset_key || null,
      source_public_id: r.context?.custom?.source_public_id || null,
    }));

    return { statusCode: 200, body: JSON.stringify({ ok:true, source:'cloudinary', data }) };
  } catch (e: any) {
    const msg = e?.message || e?.error?.message || e?.error || 'unknown error';
    const code = e?.code || 'UNKNOWN';
    console.error('[getPublicFeed] error', { code, msg, raw:e });
    return { statusCode: 400, body: JSON.stringify({ ok:false, error:`${code}: ${msg}` }) };
  }
};
