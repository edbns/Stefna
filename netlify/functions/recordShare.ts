// netlify/functions/recordShare.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // needs update perms
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
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { asset_id, shareToFeed, allowRemix } = JSON.parse(event.body || '{}');
    if (!asset_id) {
      return new Response(JSON.stringify({ error: 'asset_id required' }), { status: 400 });
    }

    const visibility = !!shareToFeed ? 'public' : 'private';
    const allow_remix = !!shareToFeed && !!allowRemix; // cannot be true if not public

    // Update only if user owns it
    const { data, error } = await supabase
      .from('media_assets')
      .update({ visibility, allow_remix })
      .eq('id', asset_id)
      .eq('user_id', userId)
      .select('id, visibility, allow_remix')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true, asset: data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'recordShare error' }), { status: 500 });
  }
};


