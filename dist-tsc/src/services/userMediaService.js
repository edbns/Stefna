// User Media Storage Service
// Manages user-generated content and remixes
class UserMediaService {
    constructor() {
        Object.defineProperty(this, "mediaStorage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        }); // userId -> media[]
        Object.defineProperty(this, "likesIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        }); // mediaId -> [userId]
        this.loadFromStorage();
    }
    static getInstance() {
        if (!UserMediaService.instance) {
            UserMediaService.instance = new UserMediaService();
        }
        return UserMediaService.instance;
    }
    // Save generated media to user profile
    async saveMedia(media, userSettings) {
        const newMedia = {
            ...media,
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            likes: 0,
            remixCount: 0,
            // Apply user settings if provided
            isPublic: userSettings?.shareToFeed ?? media.isPublic,
            allowRemix: userSettings?.allowRemix ?? media.allowRemix,
            // Assign TTL for guest media (48 hours)
            expiresAt: media.userId.startsWith('guest-') ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : undefined
        };
        const userMedia = this.mediaStorage.get(media.userId) || [];
        userMedia.unshift(newMedia); // Add to beginning (most recent first)
        this.mediaStorage.set(media.userId, userMedia);
        await this.saveToStorage();
        return newMedia;
    }
    // Save remix to user profile
    async saveRemix(userId, originalMediaId, remixUrl, remixPrompt, aspectRatio, width, height, tokensUsed, style) {
        const originalMedia = await this.getMediaById(originalMediaId);
        const remix = {
            userId,
            type: 'remix',
            url: remixUrl,
            prompt: remixPrompt,
            style,
            aspectRatio,
            width,
            height,
            originalMediaId,
            tokensUsed,
            isPublic: true,
            allowRemix: true,
            tags: originalMedia?.tags || [],
            metadata: {
                quality: 'high',
                generationTime: 2000, // 2 seconds average
                modelVersion: 'v2.0'
            },
            expiresAt: userId.startsWith('guest-') ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : undefined
        };
        const savedRemix = await this.saveMedia(remix);
        // Increment remix count on original media
        if (originalMedia) {
            await this.incrementRemixCount(originalMediaId);
        }
        return savedRemix;
    }
    // Remove expired guest media across all users
    async cleanupExpiredGuestMedia() {
        const now = Date.now();
        for (const [userId, medias] of this.mediaStorage.entries()) {
            const filtered = medias.filter(m => !(m.userId.startsWith('guest-') && m.expiresAt && new Date(m.expiresAt).getTime() < now));
            if (filtered.length !== medias.length) {
                this.mediaStorage.set(userId, filtered);
            }
        }
        await this.saveToStorage();
    }
    // Likes functionality removed - no longer needed in simplified design
    async getLikeCount(mediaId) {
        const users = this.likesIndex.get(mediaId) || [];
        return users.length;
    }
    // Check if user has liked a media
    async hasUserLiked(mediaId, userId) {
        const users = this.likesIndex.get(mediaId) || [];
        return users.includes(userId);
    }
    // Increment remix count for a media
    async incrementRemixCount(mediaId) {
        // Update count across ALL instances
        let newCount = 0;
        for (const [userId, userMedia] of this.mediaStorage.entries()) {
            const mediaIndex = userMedia.findIndex(m => m.id === mediaId);
            if (mediaIndex !== -1) {
                userMedia[mediaIndex].remixCount = (userMedia[mediaIndex].remixCount || 0) + 1;
                newCount = userMedia[mediaIndex].remixCount;
            }
        }
        await this.saveToStorage();
        return newCount;
    }
    // Get current remix count for a media
    async getRemixCount(mediaId) {
        for (const userMedia of this.mediaStorage.values()) {
            const media = userMedia.find(m => m.id === mediaId);
            if (media) {
                return media.remixCount || 0;
            }
        }
        return 0;
    }
    // Get guest media that are not expired
    async getActiveGuestMedia(userId) {
        await this.cleanupExpiredGuestMedia();
        const medias = this.mediaStorage.get(userId) || [];
        const now = Date.now();
        return medias.filter(m => !m.expiresAt || new Date(m.expiresAt).getTime() > now);
    }
    // Migrate media from a guest user to a registered user (removes TTL)
    async migrateMedia(fromUserId, toUserId) {
        const from = this.mediaStorage.get(fromUserId) || [];
        const to = this.mediaStorage.get(toUserId) || [];
        if (from.length === 0)
            return;
        const migrated = from.map(m => ({ ...m, userId: toUserId, expiresAt: undefined }));
        this.mediaStorage.set(toUserId, [...migrated, ...to]);
        this.mediaStorage.delete(fromUserId);
        await this.saveToStorage();
    }
    // Get user's media by type
    async getUserMedia(userId, type) {
        const userMedia = this.mediaStorage.get(userId) || [];
        if (type) {
            return userMedia.filter(media => media.type === type);
        }
        return userMedia;
    }
    // Get all user IDs that have media
    async getAllUsers() {
        return Array.from(this.mediaStorage.keys());
    }
    // Recovery methods for lost media
    async recoverMedia(userId) {
        try {
            const recoveredMedia = [];
            // Check for media stored under different user IDs (common issue)
            const allStorageData = localStorage.getItem('user_media_storage');
            if (allStorageData) {
                const data = JSON.parse(allStorageData);
                const mediaStorage = new Map(data);
                // Search for media that might belong to this user
                for (const [storedUserId, mediaList] of mediaStorage.entries()) {
                    // Check if this could be the same user (email-based matching)
                    if (this.isLikelySameUser(storedUserId, userId)) {
                        recoveredMedia.push(...mediaList);
                    }
                }
            }
            // Check for backup storage
            const backupData = localStorage.getItem('user_media_backup');
            if (backupData) {
                const backup = JSON.parse(backupData);
                for (const [backupUserId, mediaList] of backup.entries()) {
                    if (this.isLikelySameUser(backupUserId, userId)) {
                        recoveredMedia.push(...mediaList);
                    }
                }
            }
            // Remove duplicates based on media ID
            const uniqueMedia = this.removeDuplicateMedia(recoveredMedia);
            // If we found recovered media, save it to the current user
            if (uniqueMedia.length > 0) {
                const currentMedia = this.mediaStorage.get(userId) || [];
                const combinedMedia = [...uniqueMedia, ...currentMedia];
                this.mediaStorage.set(userId, combinedMedia);
                await this.saveToStorage();
                // Create backup
                await this.createBackup();
            }
            return uniqueMedia;
        }
        catch (error) {
            console.error('Failed to recover media:', error);
            return [];
        }
    }
    // Check if two user IDs likely belong to the same user
    isLikelySameUser(id1, id2) {
        // If they're exactly the same
        if (id1 === id2)
            return true;
        // If one is a guest ID and the other is an email-based ID
        if (id1.startsWith('guest-') && id2.includes('@'))
            return false;
        if (id2.startsWith('guest-') && id1.includes('@'))
            return false;
        // If both are email-based, check if they're the same email
        if (id1.includes('@') && id2.includes('@')) {
            return id1.toLowerCase() === id2.toLowerCase();
        }
        // If one is an email and the other is a hash of that email
        if (id1.includes('@')) {
            const emailHash = this.hashEmail(id1);
            return emailHash === id2;
        }
        if (id2.includes('@')) {
            const emailHash = this.hashEmail(id2);
            return emailHash === id1;
        }
        return false;
    }
    // Simple email hashing for comparison
    hashEmail(email) {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    // Remove duplicate media based on ID
    removeDuplicateMedia(media) {
        const seen = new Set();
        return media.filter(item => {
            if (seen.has(item.id)) {
                return false;
            }
            seen.add(item.id);
            return true;
        });
    }
    // Create backup of current media storage
    async createBackup() {
        try {
            const data = Array.from(this.mediaStorage.entries());
            localStorage.setItem('user_media_backup', JSON.stringify(data));
        }
        catch (error) {
            console.error('Failed to create backup:', error);
        }
    }
    // Get all media for a user (including recovered media)
    async getAllUserMedia(userId) {
        let media = this.mediaStorage.get(userId) || [];
        // If no media found, try to recover
        if (media.length === 0) {
            const recoveredMedia = await this.recoverMedia(userId);
            if (recoveredMedia.length > 0) {
                media = this.mediaStorage.get(userId) || [];
            }
        }
        return media;
    }
    // Get user remixes (for "Remixed" tab)
    async getUserRemixes(userId) {
        return this.getUserMedia(userId, 'remix');
    }
    // Get media that a user has liked
    async getUserLikedMedia(userId) {
        const likedMedia = [];
        // Iterate through all media to find what the user has liked
        for (const userMedia of this.mediaStorage.values()) {
            for (const media of userMedia) {
                if (await this.hasUserLiked(media.id, userId)) {
                    likedMedia.push(media);
                }
            }
        }
        return likedMedia;
    }
    // Get media by ID
    async getMediaById(mediaId) {
        for (const userMedia of this.mediaStorage.values()) {
            const media = userMedia.find(m => m.id === mediaId);
            if (media)
                return media;
        }
        return null;
    }
    // Get user stats
    async getUserStats(userId) {
        const userMedia = this.mediaStorage.get(userId) || [];
        const totalCreations = userMedia.filter(m => m.type !== 'remix').length;
        const totalRemixes = userMedia.filter(m => m.type === 'remix').length;
        const totalLikes = userMedia.reduce((sum, m) => sum + m.likes, 0);
        const totalViews = userMedia.length * 10; // Mock view count
        const tokensUsed = userMedia.reduce((sum, m) => sum + m.tokensUsed, 0);
        const averageQuality = userMedia.length > 0 ?
            userMedia.filter(m => m.metadata.quality === 'high').length / userMedia.length : 0;
        return {
            totalCreations,
            totalRemixes,
            totalLikes,
            totalViews,
            tokensUsed,
            averageQuality
        };
    }
    // Update media (for likes, visibility, etc.)
    async updateMedia(mediaId, updates) {
        for (const [userId, userMedia] of this.mediaStorage.entries()) {
            const mediaIndex = userMedia.findIndex(m => m.id === mediaId);
            if (mediaIndex !== -1) {
                this.mediaStorage.set(userId, [
                    ...userMedia.slice(0, mediaIndex),
                    { ...userMedia[mediaIndex], ...updates },
                    ...userMedia.slice(mediaIndex + 1)
                ]);
                await this.saveToStorage();
                return true;
            }
        }
        return false;
    }
    // Delete media
    async deleteMedia(userId, mediaId) {
        const userMedia = this.mediaStorage.get(userId) || [];
        const filteredMedia = userMedia.filter(m => m.id !== mediaId);
        if (filteredMedia.length !== userMedia.length) {
            this.mediaStorage.set(userId, filteredMedia);
            // Cleanup likes index for this media
            if (this.likesIndex.has(mediaId)) {
                this.likesIndex.delete(mediaId);
                await this.saveLikesIndex();
            }
            await this.saveToStorage();
            return true;
        }
        return false;
    }
    // Increment like count
    async likeMedia(mediaId) {
        return this.updateMedia(mediaId, { likes: (await this.getMediaById(mediaId))?.likes || 0 + 1 });
    }
    // Get trending media (most liked/remixed recently)
    async getTrendingMedia(limit = 20) {
        const allMedia = [];
        // Collect all public media
        for (const userMedia of this.mediaStorage.values()) {
            allMedia.push(...userMedia.filter(m => m.isPublic));
        }
        // Sort by engagement (likes + remixes) and recency
        return allMedia
            .sort((a, b) => {
            const aScore = (a.likes + a.remixCount) * this.getRecencyScore(a.timestamp);
            const bScore = (b.likes + b.remixCount) * this.getRecencyScore(b.timestamp);
            return bScore - aScore;
        })
            .slice(0, limit);
    }
    // Search user media
    async searchUserMedia(userId, query) {
        const userMedia = this.mediaStorage.get(userId) || [];
        const lowercaseQuery = query.toLowerCase();
        return userMedia.filter(media => media.prompt.toLowerCase().includes(lowercaseQuery) ||
            media.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
            media.style?.toLowerCase().includes(lowercaseQuery));
    }
    // Generate media for masonry layout with aspect ratio grouping
    generateMasonryLayout(media, columns = 3) {
        const columnHeights = new Array(columns).fill(0);
        const columnArrays = Array.from({ length: columns }, () => []);
        media.forEach(item => {
            // Find the shortest column
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
            // Add item to shortest column
            columnArrays[shortestColumnIndex].push(item);
            // Update column height (aspect ratio affects height)
            columnHeights[shortestColumnIndex] += 1 / item.aspectRatio;
        });
        return columnArrays;
    }
    // Helper: Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    // Helper: Get recency score (newer = higher score)
    getRecencyScore(timestamp) {
        const now = Date.now();
        const mediaTime = new Date(timestamp).getTime();
        const daysSince = (now - mediaTime) / (1000 * 60 * 60 * 24);
        // Exponential decay: recent content gets higher scores
        return Math.exp(-daysSince / 7); // Half-life of 7 days
    }
    // Persistence methods
    async saveToStorage() {
        try {
            const data = Array.from(this.mediaStorage.entries());
            localStorage.setItem('user_media_storage', JSON.stringify(data));
        }
        catch (error) {
            console.error('Failed to save user media:', error);
        }
    }
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('user_media_storage');
            if (saved) {
                const data = JSON.parse(saved);
                this.mediaStorage = new Map(data);
            }
            const savedLikes = localStorage.getItem('user_media_likes');
            if (savedLikes) {
                const obj = JSON.parse(savedLikes);
                this.likesIndex = new Map(Object.entries(obj));
            }
        }
        catch (error) {
            console.error('Failed to load user media:', error);
            this.mediaStorage = new Map();
        }
    }
    async saveLikesIndex() {
        try {
            const obj = {};
            for (const [mediaId, users] of this.likesIndex.entries()) {
                obj[mediaId] = users;
            }
            localStorage.setItem('user_media_likes', JSON.stringify(obj));
        }
        catch (error) {
            console.error('Failed to save likes index:', error);
        }
    }
    // Generate sample media for new users (placeholder implementation)
    async generateSampleMedia(userId) {
        // This function is kept for backward compatibility but doesn't generate any content
        // Sample media generation has been removed as it's no longer needed
        console.log('generateSampleMedia called for user:', userId, '- no sample content generated');
        return Promise.resolve();
    }
}
export default UserMediaService.getInstance();
