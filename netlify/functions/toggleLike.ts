import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

function getUserIdFromToken(auth?: string): string | null {
  try {
    if (!auth?.startsWith('Bearer ')) return null;
    const jwt = auth.slice(7);
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    const id = payload.sub || payload.uid || payload.user_id || payload.userId || payload.id;
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { asset_id } = JSON.parse(event.body || '{}');
    if (!asset_id) return new Response(JSON.stringify({ error: 'asset_id required' }), { status: 400 });

    // Check if like exists
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('asset_id', asset_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
      // fetch new count
    } else {
      await supabase.from('likes').insert({ asset_id, user_id: userId });
    }

    const { data: all } = await supabase
      .from('likes')
      .select('asset_id')
      .eq('asset_id', asset_id);

    const count = all?.length || 0;
    const liked = !existing;

    return new Response(JSON.stringify({ ok: true, liked, likes_count: count }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'toggleLike error' }), { status: 500 });
  }
};


