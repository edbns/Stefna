class TokenService {
    constructor() {
        Object.defineProperty(this, "totalTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 250000000
        });
        Object.defineProperty(this, "usedTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "rateLimitWindow", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 30
        }); // seconds
        Object.defineProperty(this, "dailyResetHour", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // midnight UTC
        // Simplified: All users get the same limits (no more tier complexity)
        Object.defineProperty(this, "DAILY_LIMIT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 30
        });
        Object.defineProperty(this, "WEEKLY_LIMIT", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 150
        });
        // Token costs - HD photos only (video removed until AIML supports it)
        Object.defineProperty(this, "PHOTO_COST", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2
        }); // 2 credits per HD photo
        // Rate limiting cache
        Object.defineProperty(this, "rateLimitCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "deviceCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        }); // deviceId -> userIds
        this.loadTokenUsage();
        this.startDailyReset();
    }
    static getInstance() {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }
    // Check if user can generate content (photos only for now)
    async canGenerate(userId, type, quality = 'hd') {
        const usage = await this.getUserUsage(userId);
        const cost = this.PHOTO_COST;
        // Check rate limiting
        if (this.isRateLimited(userId)) {
            return { canGenerate: false, reason: 'Rate limited. Please wait 30 seconds between generations.' };
        }
        // Check daily limit
        if (usage.dailyUsage + cost > this.DAILY_LIMIT) {
            return {
                canGenerate: false,
                reason: `Daily limit reached. You have ${this.DAILY_LIMIT - usage.dailyUsage} tokens remaining.`,
                remainingTokens: this.DAILY_LIMIT - usage.dailyUsage
            };
        }
        // Check total token availability
        if (this.usedTokens + cost > this.totalTokens) {
            return { canGenerate: false, reason: 'Service temporarily unavailable due to high demand.' };
        }
        return { canGenerate: true, remainingTokens: this.DAILY_LIMIT - usage.dailyUsage - cost };
    }
    // Generate content and deduct tokens (photos only for now)
    async generateContent(userId, type, quality = 'hd', prompt, ipAddress, deviceId) {
        const canGenerate = await this.canGenerate(userId, type, quality);
        if (!canGenerate.canGenerate) {
            return { success: false, tokensUsed: 0 };
        }
        const cost = this.PHOTO_COST;
        const generationId = this.generateId();
        // Record the generation
        const generation = {
            id: generationId,
            userId,
            type,
            quality,
            tokensUsed: cost,
            timestamp: new Date().toISOString(),
            prompt,
            ipAddress,
            deviceId
        };
        // Get current usage and update
        const currentUsage = await this.getUserUsage(userId);
        currentUsage.dailyUsage += cost;
        currentUsage.totalUsage += cost;
        await this.saveUserUsage(userId, currentUsage);
        this.usedTokens += cost;
        // Set rate limit
        this.setRateLimit(userId);
        // Track device usage
        this.trackDeviceUsage(deviceId, userId);
        // Save generation record
        await this.saveGeneration(generation);
        return { success: true, tokensUsed: cost, generationId };
    }
    // Get user's current token usage
    async getUserUsage(userId) {
        const key = `token_usage_${userId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const usage = JSON.parse(stored);
                // Check if daily reset is needed
                if (this.shouldResetDaily(usage.lastReset)) {
                    const resetUsage = {
                        ...usage,
                        dailyUsage: 0,
                        lastReset: new Date().toISOString()
                    };
                    this.saveUserUsage(userId, resetUsage);
                    return resetUsage;
                }
                return usage;
            }
            catch {
                // Invalid stored data, create new
            }
        }
        // Create new usage record
        const newUsage = {
            dailyUsage: 0,
            dailyLimit: this.DAILY_LIMIT,
            totalUsage: 0,
            lastReset: new Date().toISOString()
        };
        this.saveUserUsage(userId, newUsage);
        return newUsage;
    }
    // Save user's token usage
    async saveUserUsage(userId, usage) {
        const key = `token_usage_${userId}`;
        localStorage.setItem(key, JSON.stringify(usage));
    }
    // Save generation record
    async saveGeneration(generation) {
        const key = `generation_${generation.id}`;
        localStorage.setItem(key, JSON.stringify(generation));
    }
    // Generate unique ID
    generateId() {
        return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Load token usage from localStorage
    loadTokenUsage() {
        // Load total used tokens from localStorage
        const totalUsed = localStorage.getItem('total_tokens_used');
        if (totalUsed) {
            try {
                this.usedTokens = parseInt(totalUsed) || 0;
            }
            catch {
                this.usedTokens = 0;
            }
        }
    }
    // Start daily reset timer
    startDailyReset() {
        setInterval(() => {
            this.resetDailyUsage();
        }, 60000); // Check every minute
    }
    // Reset daily usage for all users
    resetDailyUsage() {
        const now = new Date();
        if (now.getUTCHours() === this.dailyResetHour && now.getUTCMinutes() === 0) {
            // Reset daily usage for all users
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('token_usage_')) {
                    try {
                        const usage = JSON.parse(localStorage.getItem(key) || '{}');
                        if (this.shouldResetDaily(usage.lastReset)) {
                            usage.dailyUsage = 0;
                            usage.lastReset = new Date().toISOString();
                            localStorage.setItem(key, JSON.stringify(usage));
                        }
                    }
                    catch {
                        // Invalid data, skip
                    }
                }
            });
        }
    }
    // Get token cost for generation type (simplified - photos only)
    getTokenCost(type, quality = 'hd') {
        return this.PHOTO_COST;
    }
    // Check if user is rate limited
    isRateLimited(userId) {
        const lastGeneration = this.rateLimitCache.get(userId);
        if (!lastGeneration)
            return false;
        const now = Date.now();
        return (now - lastGeneration) < (this.rateLimitWindow * 1000);
    }
    // Set rate limit for user
    setRateLimit(userId) {
        this.rateLimitCache.set(userId, Date.now());
    }
    // Track device usage
    trackDeviceUsage(deviceId, userId) {
        const users = this.deviceCache.get(deviceId) || [];
        if (!users.includes(userId)) {
            users.push(userId);
            this.deviceCache.set(deviceId, users);
        }
    }
    // Check if daily reset is needed
    shouldResetDaily(lastReset) {
        const lastResetDate = new Date(lastReset);
        const now = new Date();
        const resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.dailyResetHour);
        return lastResetDate < resetDate;
    }
    // Get daily limit (simplified - same for all users)
    getDailyLimit() {
        return this.DAILY_LIMIT;
    }
    // Get weekly limit (simplified - same for all users)
    getWeeklyLimit() {
        return this.WEEKLY_LIMIT;
    }
    // Get referral stats from backend (real data, not localStorage)
    async getReferralStats(userId) {
        try {
            // This should call the backend to get real referral data
            // For now, return placeholder data
            return {
                invites: 0,
                tokensEarned: 0,
                referralCode: `REF_${userId.slice(-6)}`
            };
        }
        catch (error) {
            console.error('Failed to get referral stats:', error);
            return {
                invites: 0,
                tokensEarned: 0,
                referralCode: `REF_${userId.slice(-6)}`
            };
        }
    }
    // Generate referral code
    async generateReferralCode(userId) {
        return `REF_${userId.slice(-6)}_${Date.now().toString(36)}`;
    }
    // Anti-abuse: Check for multiple accounts from same device/IP
    async checkForAbuse(deviceId, ipAddress) {
        // Check device usage
        const deviceUsers = this.deviceCache.get(deviceId) || [];
        if (deviceUsers.length > 3) {
            return { isAbuse: true, reason: 'Too many accounts from same device' };
        }
        // Check IP usage (simplified - in production would use proper IP tracking)
        const ipUsers = Array.from(this.deviceCache.values()).flat();
        const ipCount = ipUsers.filter(userId => userId.includes(ipAddress)).length;
        if (ipCount > 5) {
            return { isAbuse: true, reason: 'Too many accounts from same IP' };
        }
        return { isAbuse: false };
    }
    // Get service statistics
    getServiceStats() {
        const remaining = this.totalTokens - this.usedTokens;
        const percentage = (this.usedTokens / this.totalTokens) * 100;
        return {
            totalTokens: this.totalTokens,
            usedTokens: this.usedTokens,
            remainingTokens: remaining,
            usagePercentage: percentage
        };
    }
    // Emergency: Temporarily disable service
    emergencyDisable() {
        this.totalTokens = 0;
        console.warn('Token service emergency disabled');
    }
    // Emergency: Restore service with new token count
    emergencyRestore(newTokenCount) {
        this.totalTokens = newTokenCount;
        console.log(`Token service restored with ${newTokenCount} tokens`);
    }
}
export default TokenService;
