import { getUserJwt, supabaseForUser } from '../lib/supabaseUser';

const ok = (b: any) => ({ statusCode: 200, body: JSON.stringify(b) });
const err = (s: number, m: string) => ({ statusCode: s, body: JSON.stringify({ error: m }) });

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'POST') return err(405, 'Method Not Allowed');
    
    const jwt = getUserJwt(event);
    if (!jwt) return err(401, 'Sign in to like');
    
    const { asset_id } = JSON.parse(event.body || '{}');
    if (!asset_id) return err(400, 'asset_id is required');
    
    const supa = supabaseForUser(jwt);
    
    const { data: existing, error: selErr } = await supa
      .from('likes')
      .select('id')
      .eq('asset_id', asset_id)
      .maybeSingle();
    
    if (selErr) return err(500, 'Failed to check existing like');
    
    if (existing) {
      const { error } = await supa
        .from('likes')
        .delete()
        .eq('id', existing.id);
      
      if (error) return err(500, error.message);
      return ok({ liked: false });
    }
    
    const { error } = await supa
      .from('likes')
      .insert({ asset_id });
    
    if (error) return err(500, error.message);
    return ok({ liked: true });
  } catch (e: any) {
    return err(500, e?.message || 'toggleLike failed');
  }
};

