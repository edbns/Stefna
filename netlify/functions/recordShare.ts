import { getUserJwt, supabaseForUser } from '../lib/supabaseUser';

const ok = (b: any) => ({ statusCode: 200, body: JSON.stringify(b) });
const err = (s: number, m: string) => ({ statusCode: s, body: JSON.stringify({ error: m }) });

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') return err(405, 'Method Not Allowed');
    
    const jwt = getUserJwt(event);
    if (!jwt) return err(401, 'Sign in to change visibility');
    
    const { asset_id, shareToFeed, allowRemix } = JSON.parse(event.body || '{}');
    if (!asset_id) return err(400, 'asset_id is required');
    
    const visibility = shareToFeed ? 'public' : 'private';
    const allow_remix = shareToFeed ? !!allowRemix : false;
    
    const supa = supabaseForUser(jwt);
    
    const { data, error } = await supa
      .from('media_assets')
      .update({ visibility, allow_remix })
      .eq('id', asset_id)
      .select('id, visibility, allow_remix')
      .maybeSingle();
    
    if (error) {
      if (/row-level security/i.test(error.message)) return err(403, 'Not allowed');
      return err(400, error.message);
    }
    
    if (!data) return err(404, 'Media not found');
    
    return ok({ asset: data });
  } catch (e: any) {
    return err(500, e?.message || 'recordShare failed');
  }
};

