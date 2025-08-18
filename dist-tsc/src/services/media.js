// src/services/media.ts
import { authenticatedFetch } from '../utils/apiClient';
/**
 * Get current user's media with profile information attached
 */
export async function getMyMediaWithProfile() {
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
        return media.map((m) => ({
            ...m,
            owner_profile: profile,
            owner_id: m.userId || m.owner_id,
            type: m.resource_type || m.type,
            visibility: m.visibility || 'private',
            allow_remix: m.allow_remix || false
        }));
    }
    catch (error) {
        console.error('Failed to get user media:', error);
        return [];
    }
}
/**
 * Get public media feed with profile information for each item
 */
export async function getPublicMediaWithProfiles(limit = 50) {
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
        return media.map((item) => ({
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
    }
    catch (error) {
        console.error('Failed to get public media:', error);
        return [];
    }
}
/**
 * Get media by specific user with their profile
 */
export async function getUserMediaWithProfile(userId) {
    try {
        // Get user's media from our new Netlify function
        const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?ownerId=${userId}`, {
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
        return media.map((m) => ({
            ...m,
            owner_profile: profile,
            owner_id: userId,
            type: m.resource_type || m.type,
            visibility: m.visibility || 'private',
            allow_remix: m.allow_remix || false
        }));
    }
    catch (error) {
        console.error('Failed to get user media with profile:', error);
        return [];
    }
}
/**
 * Like/unlike a media item
 */
export async function toggleMediaLike(mediaId) {
    try {
        // For now, return a placeholder since we don't have likes implemented yet
        // TODO: Implement likes functionality with Netlify functions
        console.log('Likes functionality not yet implemented');
        return {
            liked: false,
            likeCount: 0
        };
    }
    catch (error) {
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
export async function updateMediaSharing(mediaId, visibility, allowRemix) {
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
    }
    catch (error) {
        console.error('Failed to update media sharing:', error);
        throw error;
    }
}
/**
 * Delete media item
 */
export async function deleteMedia(mediaId) {
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
    }
    catch (error) {
        console.error('Failed to delete media:', error);
        throw error;
    }
}
/**
 * Create/remix media item
 */
export async function createMediaItem(mediaData) {
    try {
        // Use our new Netlify function for creating media
        const response = await authenticatedFetch('/.netlify/functions/save-media', {
            method: 'POST',
            body: JSON.stringify({
                url: mediaData.url,
                prompt: mediaData.prompt,
                type: mediaData.type,
                visibility: mediaData.visibility || 'private',
                allow_remix: mediaData.allow_remix || false,
                parent_asset_id: mediaData.parent_media_id
            })
        });
        if (!response.ok) {
            throw new Error(`Failed to create media: ${response.statusText}`);
        }
        const result = await response.json();
        const createdMedia = result.results?.[0] || result;
        return {
            ...createdMedia,
            owner_id: createdMedia.owner_id || createdMedia.user_id,
            type: createdMedia.resource_type || createdMedia.type,
            visibility: createdMedia.visibility || mediaData.visibility || 'private',
            allow_remix: createdMedia.allow_remix || mediaData.allow_remix || false
        };
    }
    catch (error) {
        console.error('Failed to create media item:', error);
        throw error;
    }
}
