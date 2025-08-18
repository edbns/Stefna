import authService from './authService';
class InteractionService {
    constructor() {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '/.netlify/functions'
        });
    }
    // Toggle like on media
    async toggleLike(mediaId) {
        try {
            const token = authService.getToken();
            if (!token) {
                return { success: false, action: 'error', error: 'Sign in to like' };
            }
            const response = await fetch(`${this.baseUrl}/toggleLike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ asset_id: mediaId })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to toggle like');
            }
            const result = await response.json();
            return {
                success: !!result.ok,
                action: result.liked ? 'liked' : 'unliked',
                likeCount: result.likes_count,
                isLiked: result.liked
            };
        }
        catch (error) {
            console.error('Toggle like error:', error);
            return {
                success: false,
                action: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Record a share of media (unused in NO_DB_MODE; kept for compatibility)
    async recordShare(mediaId, shareType = 'public') {
        try {
            const token = authService.getToken();
            if (!token) {
                return { success: false, action: 'error', error: 'Sign in to change visibility' };
            }
            const response = await fetch(`${this.baseUrl}/recordShare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ asset_id: mediaId, shareToFeed: shareType === 'public' })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to record share');
            }
            const result = await response.json();
            return {
                success: true,
                action: 'shared',
                shareCount: 1
            };
        }
        catch (error) {
            console.error('Record share error:', error);
            return {
                success: false,
                action: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get interaction counts for media
    async getInteractionCounts(mediaId) {
        try {
            return {
                likes: 0,
                remixes: 0,
                shares: 0
            };
        }
        catch (error) {
            console.error('Get interaction counts error:', error);
            return {
                likes: 0,
                remixes: 0,
                shares: 0
            };
        }
    }
    // Check if current user has interacted with media
    async getUserInteractions(mediaId) {
        try {
            return {
                hasLiked: false,
                hasRemixed: false,
                hasShared: false
            };
        }
        catch (error) {
            console.error('Get user interactions error:', error);
            return {
                hasLiked: false,
                hasRemixed: false,
                hasShared: false
            };
        }
    }
    // Update local state after successful interaction
    updateLocalCounts(mediaId, type, action, currentCounts) {
        const newCounts = { ...currentCounts };
        if (type === 'like') {
            if (action === 'add') {
                newCounts[`${mediaId}_likes`] = (newCounts[`${mediaId}_likes`] || 0) + 1;
            }
            else {
                newCounts[`${mediaId}_likes`] = Math.max(0, (newCounts[`${mediaId}_likes`] || 0) - 1);
            }
        }
        else if (type === 'share') {
            if (action === 'add') {
                newCounts[`${mediaId}_shares`] = (newCounts[`${mediaId}_shares`] || 0) + 1;
            }
        }
        else if (type === 'remix') {
            if (action === 'add') {
                newCounts[`${mediaId}_remixes`] = (newCounts[`${mediaId}_remixes`] || 0) + 1;
            }
        }
        return newCounts;
    }
}
// Export singleton instance
export const interactionService = new InteractionService();
export default interactionService;
