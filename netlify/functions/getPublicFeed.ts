// netlify/functions/getPublicFeed.ts
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { initCloudinary } from './_cloudinary';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const handler: Handler = async (event) => {
  if (process.env.NO_DB_MODE === 'true') {
    const cloudinary = initCloudinary();
    const url = new URL(event.rawUrl);
    const limit = Number(url.searchParams.get('limit') ?? 50);

    try {
      const res = await cloudinary.search
        .expression('tags=stefna AND tags=type:output AND tags=public')
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
      console.error('[getPublicFeed] error', e);
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: e?.message || 'unknown error' }) };
    }
  }

  const url = new URL(event.rawUrl);
  const limit = Number(url.searchParams.get('limit') ?? 50);

  const { data, error } = await supabase
    .from('public_feed_v2')
    .select('id, cloudinary_public_id, media_type, published_at, source_asset_id, preset_key')
    .limit(limit);

  if (error) return { statusCode: 400, body: JSON.stringify({ ok:false, error: error.message }) };
  return { statusCode: 200, body: JSON.stringify({ ok:true, data }) };
};
