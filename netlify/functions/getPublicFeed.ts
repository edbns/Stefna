import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const qs = new URL(event.rawUrl).searchParams;
    const limit = Math.min(parseInt(qs.get('limit') || '50', 10), 100);

    // public only
    const { data: media, error } = await supabase
      .from('media_assets')
      .select('id,user_id,url,resource_type,visibility,allow_remix,created_at,prompt,mode,model,metadata')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    const ids = media?.map(m => m.id) || [];

    // likes (group in code)
    const { data: likesRows } = await supabase
      .from('likes')
      .select('asset_id')
      .in('asset_id', ids);

    const likeCounts = new Map<string, number>();
    (likesRows || []).forEach(r => likeCounts.set(r.asset_id, (likeCounts.get(r.asset_id) || 0) + 1));

    const items = (media || []).map(m => ({
      ...m,
      // fallback thumbnail -> url for now
      thumbnail_url: (m as any).thumbnail_url || m.url,
      likes_count: likeCounts.get(m.id) || 0
    }));

    return new Response(JSON.stringify({ items }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'getPublicFeed error' }), { status: 500 });
  }
};
