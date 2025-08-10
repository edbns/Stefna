import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

const ok = (b) => ({ statusCode: 200, body: JSON.stringify(b) });
const bad = (s, m) => ({ statusCode: s, body: JSON.stringify({ error: m }) });

export const handler = async (event) => {
  try {
    const auth = event.headers.authorization || event.headers.Authorization;
    const jwt = auth?.replace(/^Bearer\s+/i, '');

    if (!jwt) return bad(401, 'Missing user token');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // read uploads + generated in one go; RLS limits to the user automatically
    const { data, error } = await supabase
      .from('media_assets') // query the base table with RLS
      .select('id, url, resource_type, visibility, allow_remix, created_at, result_url, source_url, prompt, model, mode, strength, parent_asset_id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return bad(500, error.message);
    return ok({ items: data ?? [] });
  } catch (e) {
    return bad(500, e?.message || 'Unknown getUserMedia error');
  }
};
