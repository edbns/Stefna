import { authenticatedFetch } from '../utils/apiClient';
import type { Asset } from './types';

export async function fetchPublicFeed(limit = 50): Promise<Asset[]> {
  try {
    // Use the correct public feed function that respects privacy settings
    const response = await authenticatedFetch(`/.netlify/functions/getPublicFeed?limit=${limit}`, {
      method: 'GET'
    });

    if (!response.ok) {
      console.error('[feed] Error fetching from getUserMedia:', response.statusText);
      return [];
    }

    const result = await response.json();
    const media = result.items || [];

    // Transform to match Asset type
    return media.map((item: any) => ({
      id: item.id,
      cloudinary_public_id: item.cloudinary_public_id || item.public_id,
      media_type: item.resource_type || item.type,
      published_at: item.created_at,
      source_asset_id: item.source_asset_id || null,
      preset_key: item.meta?.preset_key || null,
      prompt: item.prompt || null
    })) as Asset[];
  } catch (err) {
    console.error('[feed] Unexpected error:', err);
    return [];
  }
}
