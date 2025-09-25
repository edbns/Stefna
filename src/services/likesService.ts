import { authenticatedFetch } from '../utils/apiClient';

interface ToggleLikeResponse {
  success: boolean;
  liked: boolean;
  likesCount: number;
  mediaId: string;
  mediaType: string;
}

interface UserLikesResponse {
  likes: Record<string, boolean>;
  count: number;
}

export async function toggleLike(
  mediaId: string, 
  mediaType: 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'cyber_siren' | 'presets' | 'story' | 'edit' | 'parallel_self'
): Promise<ToggleLikeResponse> {
  try {
    const response = await authenticatedFetch('/.netlify/functions/toggleLike', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaId,
        mediaType
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle like: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('💥 [likesService] toggleLike error:', error);
    throw error;
  }
}

export async function getUserLikes(): Promise<UserLikesResponse> {
  try {
    const response = await authenticatedFetch('/.netlify/functions/getUserLikes', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get user likes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('💥 [likesService] getUserLikes error:', error);
    // Return empty likes on error
    return { likes: {}, count: 0 };
  }
}

// Helper to generate consistent like keys across all components
export function generateLikeKey(media: { id: string; metadata?: { presetType?: string }; type?: string }): string {
  const dbType = (media.metadata?.presetType || media.type || 'presets').replace(/-/g, '_')
  return `${dbType}:${media.id}`
}

// Helper to map database media type to API media type
export function mapMediaTypeForAPI(dbType: string): 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'cyber_siren' | 'presets' | 'story' | 'edit' | 'parallel_self' {
  const typeMapping: Record<string, 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'cyber_siren' | 'presets' | 'story' | 'edit' | 'parallel_self'> = {
    'custom_prompt': 'custom_prompt',
    'unreal_reflection': 'unreal_reflection',
    'ghibli_reaction': 'ghibli_reaction',
    'cyber_siren': 'cyber_siren',
    'presets': 'presets',
    'story': 'story',
    'story_time': 'story',
    'edit': 'edit', // Studio items use edit directly - no mapping!
    'parallel_self': 'parallel_self',
    // Also handle variations that might come from the feed
    'custom': 'custom_prompt',
    'unrealreflection': 'unreal_reflection',
    'ghiblireact': 'ghibli_reaction',
    'cyber-siren': 'cyber_siren',
    'preset': 'presets',
    'storytime': 'story',
    'parallel-self': 'parallel_self'
  };
  
  return typeMapping[dbType] || 'presets';
}
