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
  mediaType: 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'neo_glitch' | 'presets' | 'story' | 'edit'
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

// Helper to map database media type to API media type
export function mapMediaTypeForAPI(dbType: string): 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'neo_glitch' | 'presets' | 'story' | 'edit' {
  const typeMapping: Record<string, 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'neo_glitch' | 'presets' | 'story' | 'edit'> = {
    'custom_prompt': 'custom_prompt',
    'unreal_reflection': 'unreal_reflection',
    'ghibli_reaction': 'ghibli_reaction',
    'neo_glitch': 'neo_glitch',
    'presets': 'presets',
    'story': 'story',
    'story_time': 'story',
    'edit': 'edit', // Studio items use edit directly - no mapping!
    // Also handle variations that might come from the feed
    'custom': 'custom_prompt',
    'unrealreflection': 'unreal_reflection',
    'ghiblireact': 'ghibli_reaction',
    'neo-glitch': 'neo_glitch',
    'preset': 'presets',
    'storytime': 'story'
  };
  
  return typeMapping[dbType] || 'presets';
}
