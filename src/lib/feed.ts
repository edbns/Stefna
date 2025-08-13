import { supabaseClient } from './supabaseClient';
import type { Asset } from './types';

export async function fetchPublicFeed(limit = 50): Promise<Asset[]> {
  try {
    // Use the public_feed view for safer, filtered results
    const { data, error } = await supabaseClient
      .from('public_feed')
      .select('id, cloudinary_public_id, media_type, published_at, source_asset_id, preset_key, prompt')
      .limit(limit);

    if (error) {
      console.error('[feed] Error fetching from public_feed view:', error);
      
      // Fallback: query the assets table directly if view fails
      console.log('[feed] Falling back to direct assets query...');
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('assets')
        .select('id, cloudinary_public_id, media_type, published_at, source_asset_id, preset_key, prompt')
        .eq('is_public', true)
        .eq('status', 'ready')
        .not('published_at', 'is', null)
        .not('cloudinary_public_id', 'is', null)
        .not('media_type', 'is', null)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error('[feed] Fallback query also failed:', fallbackError);
        return [];
      }

      return fallbackData as unknown as Asset[];
    }

    return data as unknown as Asset[];
  } catch (err) {
    console.error('[feed] Unexpected error:', err);
    return [];
  }
}
