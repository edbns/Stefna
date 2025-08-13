import { supabaseClient } from './supabaseClient';
import type { Asset } from './types';

export async function fetchPublicFeed(limit = 50): Promise<Asset[]> {
  // Use the public_feed view for safer, filtered results
  const { data, error } = await supabaseClient
    .from('public_feed')
    .select('id, cloudinary_public_id, media_type, published_at, source_asset_id, preset_key')
    .limit(limit);

  if (error) {
    console.error('feed error', error);
    return [];
  }
  return data as unknown as Asset[];
}
