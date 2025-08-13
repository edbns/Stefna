// netlify/functions/getPublicFeed.ts
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const handler: Handler = async (event) => {
  const url = new URL(event.rawUrl);
  const limit = Number(url.searchParams.get('limit') ?? 50);

  const { data, error } = await supabase
    .from('public_feed_v2')
    .select('id, cloudinary_public_id, media_type, published_at, source_asset_id, preset_key')
    .limit(limit);

  if (error) return { statusCode: 400, body: JSON.stringify({ ok:false, error: error.message }) };
  return { statusCode: 200, body: JSON.stringify({ ok:true, data }) };
};
