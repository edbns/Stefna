import { supabaseClient } from './supabaseClient';
import type { Asset } from './types';

export async function fetchPublicFeed(limit = 50): Promise<Asset[]> {
  // If you created a view public_feed with RLS, you could select from it directly.
  // Otherwise, query the table with matching filters:
  const { data, error } = await supabaseClient
    .from('assets')
    .select('id, cloudinary_public_id, media_type, published_at, source_asset_id, preset_key')
    .eq('is_public', true)
    .eq('status', 'ready')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('feed error', error);
    return [];
  }
  return data as unknown as Asset[];
}
