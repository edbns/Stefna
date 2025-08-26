// src/services/media.ts
import { authenticatedFetch } from '../utils/apiClient';
import type { Profile } from './profile';

export interface MediaItem {
  id: string;
  owner_id: string;
  url: string;
  prompt?: string;
  type: 'image' | 'video';
  visibility: 'public' | 'private';
  allow_remix: boolean;
  created_at: string;
  updated_at: string;
  likes?: number;
  remix_count?: number;
  // Profile data attached for UI
  owner_profile?: Profile;
}

/**
 * Get current user's media with profile information attached
 */
export async function getMyMediaWithProfile(): Promise<MediaItem[]> {
  try {
    // Get my media from our new Netlify function
    const response = await authenticatedFetch('/.netlify/functions/getUserMedia', {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user media: ${response.statusText}`);
    }

    const result = await response.json();
    const media = result.items || [];

    // Get my profile from our new Netlify function
    const profileResponse = await authenticatedFetch('/.netlify/functions/get-user-profile', {
      method: 'GET'
    });

    let profile = null;
    if (profileResponse.ok) {
      const profileResult = await profileResponse.json();
      profile = profileResult.ok && profileResult.profile ? profileResult.profile : profileResult;
    }

    // Transform to match expected format
    return media.map((m: any) => ({ 
      ...m, 
      owner_profile: profile,
      owner_id: m.userId || m.owner_id,
      type: m.resource_type || m.type,
      visibility: m.visibility || 'private',
      allow_remix: m.allow_remix || false
    }));
  } catch (error) {
    console.error('Failed to get user media:', error);
    return [];
  }
}

/**
 * Get public media feed with profile information for each item
 */
export async function getPublicMediaWithProfiles(limit: number = 50): Promise<MediaItem[]> {
  try {
    // Get public media from our new Netlify function
    const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?limit=${limit}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch public media: ${response.statusText}`);
    }

    const result = await response.json();
    const media = result.items || [];

    // Transform to match expected format
    return media.map((item: any) => ({
      ...item,
      owner_profile: {
        username: item.userId || 'unknown',
        avatar_url: '',
        share_to_feed: true,
        allow_remix: item.allow_remix || false
      },
      owner_id: item.userId || item.owner_id,
      type: item.resource_type || item.type,
      visibility: item.visibility || 'private',
      allow_remix: item.allow_remix || false
    }));
  } catch (error) {
    console.error('Failed to get public media:', error);
    return [];
  }
}

/**
 * Get media by specific user with their profile
 */
export async function getUserMediaWithProfile(userId: string): Promise<MediaItem[]> {
  try {
    // Get user's media from our new Netlify function
          const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${userId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user media: ${response.statusText}`);
    }

    const result = await response.json();
    const media = result.items || [];

    // Get user's profile from our new Netlify function
    const profileResponse = await authenticatedFetch(`/.netlify/functions/get-user-profile`, {
      method: 'GET'
    });

    let profile = null;
    if (profileResponse.ok) {
      const profileResult = await profileResponse.json();
      profile = profileResult.ok && profileResult.profile ? profileResult.profile : profileResult;
    }

    // Transform to match expected format
    return media.map((m: any) => ({ 
      ...m, 
      owner_profile: profile,
      owner_id: userId,
      type: m.resource_type || m.type,
      visibility: m.visibility || 'private',
      allow_remix: m.allow_remix || false
    }));
  } catch (error) {
    console.error('Failed to get user media with profile:', error);
    return [];
  }
}

/**
 * Like/unlike a media item
 */
export async function toggleMediaLike(mediaId: string): Promise<{ liked: boolean; likeCount: number }> {
  try {
    // For now, return a placeholder since we don't have likes implemented yet
    // TODO: Implement likes functionality with Netlify functions
    console.log('Likes functionality not yet implemented');
    return {
      liked: false,
      likeCount: 0
    };
  } catch (error) {
    console.error('Failed to toggle media like:', error);
    return {
      liked: false,
      likeCount: 0
    };
  }
}

/**
 * Update media sharing preferences
 */
export async function updateMediaSharing(
  mediaId: string, 
  visibility: 'public' | 'private', 
  allowRemix: boolean
): Promise<MediaItem> {
  try {
    // Use our new Netlify function for updating media visibility
    const response = await authenticatedFetch('/.netlify/functions/updateMediaVisibility', {
      method: 'POST',
      body: JSON.stringify({
        mediaId,
        visibility,
        allowRemix
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update media sharing: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      ...result,
      owner_id: result.owner_id || result.user_id,
      type: result.resource_type || result.type,
      visibility: result.visibility || visibility,
      allow_remix: result.allow_remix || allowRemix
    };
  } catch (error) {
    console.error('Failed to update media sharing:', error);
    throw error;
  }
}

/**
 * Delete media item
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  try {
    // Use our new Netlify function for deleting media
    const response = await authenticatedFetch('/.netlify/functions/delete-media', {
      method: 'POST',
      body: JSON.stringify({
        mediaId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete media: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete media:', error);
    throw error;
  }
}

/**
 * Create/remix media item
 */
export async function createMediaItem(mediaData: {
  url: string;
  prompt?: string;
  type: 'image' | 'video';
  visibility?: 'public' | 'private';
  allow_remix?: boolean;
  parent_media_id?: string; // For remixes
}): Promise<MediaItem> {
  try {
    // 🆕 [New System] All media creation now goes through dedicated generation functions
    console.log('🆕 [New System] Media creation handled by dedicated functions - no old save-media needed');
    throw new Error('Direct media creation is deprecated - use dedicated generation functions');
  } catch (error) {
    console.error('Failed to create media item:', error);
    throw error;
  }
}
