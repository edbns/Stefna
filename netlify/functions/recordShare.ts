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
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { asset_id, shareToFeed, allowRemix } = JSON.parse(event.body || '{}');
    if (!asset_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'asset_id required' }) };
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
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, asset: data }) };
  } catch (e: any) {
    console.error('recordShare error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'recordShare error' }) };
  }
};


