export interface TokenUsage {
  dailyUsage: number;
  dailyLimit: number;
  totalUsage: number;
  lastReset: string;
}

export interface TokenGeneration {
  id: string;
  userId: string;
  type: 'photo';  // Removed 'video' since it's not working yet
  quality: 'hd';  // Simplified to HD only
  tokensUsed: number;
  timestamp: string;
  prompt: string;
  ipAddress: string;
  deviceId: string;
}

class TokenService {
  private static instance: TokenService
  private totalTokens: number = 250_000_000
  private usedTokens: number = 0
  private rateLimitWindow: number = 30 // seconds
  private dailyResetHour: number = 0 // midnight UTC

  // Simplified: All users get the same limits (no more tier complexity)
  private readonly DAILY_LIMIT = 30
  private readonly WEEKLY_LIMIT = 150

  // Token costs - HD photos only (video removed until AIML supports it)
  private readonly PHOTO_COST = 2  // 2 credits per HD photo

  // Rate limiting cache
  private rateLimitCache: Map<string, number> = new Map()
  private deviceCache: Map<string, string[]> = new Map() // deviceId -> userIds

  constructor() {
    this.loadTokenUsage()
    this.startDailyReset()
  }

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService()
    }
    return TokenService.instance
  }

  // Check if user can generate content (photos only for now)
  async canGenerate(userId: string, type: 'photo', quality: 'hd' = 'hd'): Promise<{ canGenerate: boolean; reason?: string; remainingTokens?: number }> {
    try {
      // Use backend to check credits instead of local calculation
      const response = await fetch('/.netlify/functions/getQuota', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Failed to get backend quota, falling back to local check');
        return this.localCanGenerate(userId, type, quality);
      }

      const quota = await response.json();
      const cost = this.PHOTO_COST;
      const remaining = quota.remaining || (quota.daily_limit - quota.daily_used);
      
      if (remaining < cost) {
        return { 
          canGenerate: false, 
          reason: `Insufficient credits. You need ${cost} credits but only have ${remaining}.`,
          remainingTokens: remaining
        }
      }

      // Check rate limiting
      if (this.isRateLimited(userId)) {
        return { canGenerate: false, reason: 'Rate limited. Please wait 30 seconds between generations.' }
      }

      return { canGenerate: true, remainingTokens: remaining - cost }
    } catch (error) {
      console.warn('Backend quota check failed, falling back to local check:', error);
      return this.localCanGenerate(userId, type, quality);
    }
  }

  // Fallback local check (legacy)
  private async localCanGenerate(userId: string, type: 'photo', quality: 'hd' = 'hd'): Promise<{ canGenerate: boolean; reason?: string; remainingTokens?: number }> {
    const usage = await this.getUserUsage(userId)
    const cost = this.PHOTO_COST

    // Check rate limiting
    if (this.isRateLimited(userId)) {
      return { canGenerate: false, reason: 'Rate limited. Please wait 30 seconds between generations.' }
    }

    // Check daily limit
    if (usage.dailyUsage + cost > this.DAILY_LIMIT) {
      return { 
        canGenerate: false, 
        reason: `Daily limit reached. You have ${this.DAILY_LIMIT - usage.dailyUsage} tokens remaining.`,
        remainingTokens: this.DAILY_LIMIT - usage.dailyUsage
      }
    }

    // Check total token availability
    if (this.usedTokens + cost > this.totalTokens) {
      return { canGenerate: false, reason: 'Service temporarily unavailable due to high demand.' }
    }

    return { canGenerate: true, remainingTokens: this.DAILY_LIMIT - usage.dailyUsage - cost }
  }

  // Get auth token from localStorage or auth service
  private getAuthToken(): string {
    // Try to get from localStorage first
    const token = localStorage.getItem('auth_token') || localStorage.getItem('jwt_token');
    if (token) return token;
    
    // Fallback to auth service if available
    try {
      // @ts-ignore - dynamic import
      const authService = require('./authService').default;
      return authService.getToken() || '';
    } catch {
      return '';
    }
  }

  // Generate content and deduct tokens (photos only for now)
  async generateContent(userId: string, type: 'photo', quality: 'hd' = 'hd', prompt: string, ipAddress: string, deviceId: string): Promise<{ success: boolean; tokensUsed: number; generationId?: string }> {
    const canGenerate = await this.canGenerate(userId, type, quality)
    
    if (!canGenerate.canGenerate) {
      return { success: false, tokensUsed: 0 }
    }

    const cost = this.PHOTO_COST
    const generationId = this.generateId()

    // Record the generation
    const generation: TokenGeneration = {
      id: generationId,
      userId,
      type,
      quality,
      tokensUsed: cost,
      timestamp: new Date().toISOString(),
      prompt,
      ipAddress,
      deviceId
    }

    // Get current usage and update
    const currentUsage = await this.getUserUsage(userId)
    currentUsage.dailyUsage += cost
    currentUsage.totalUsage += cost
    await this.saveUserUsage(userId, currentUsage)
    this.usedTokens += cost

    // Set rate limit
    this.setRateLimit(userId)

    // Track device usage
    this.trackDeviceUsage(deviceId, userId)

    // Save generation record
    await this.saveGeneration(generation)

    return { success: true, tokensUsed: cost, generationId }
  }

  // Get user's current token usage
  async getUserUsage(userId: string): Promise<TokenUsage> {
    try {
      // Try to get from backend first
      const response = await fetch('/.netlify/functions/getQuota', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const quota = await response.json();
        return {
          dailyUsage: quota.daily_used || 0,
          dailyLimit: quota.daily_limit || 30,
          totalUsage: quota.weekly_used || 0,
          lastReset: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('Backend quota check failed, falling back to local storage:', error);
    }

    // Fallback to localStorage
    const key = `token_usage_${userId}`
    const stored = localStorage.getItem(key)
    
    if (stored) {
      try {
        const usage = JSON.parse(stored)
        // Check if daily reset is needed
        if (this.shouldResetDaily(usage.lastReset)) {
          const resetUsage = {
            ...usage,
            dailyUsage: 0,
            lastReset: new Date().toISOString()
          }
          this.saveUserUsage(userId, resetUsage)
          return resetUsage
        }
        return usage
      } catch {
        // Invalid stored data, create new
      }
    }

    // Create new usage record
    const newUsage: TokenUsage = {
      dailyUsage: 0,
      dailyLimit: this.DAILY_LIMIT,
      totalUsage: 0,
      lastReset: new Date().toISOString()
    }
    
    this.saveUserUsage(userId, newUsage)
    return newUsage
  }

  // Save user's token usage
  private async saveUserUsage(userId: string, usage: TokenUsage): Promise<void> {
    const key = `token_usage_${userId}`
    localStorage.setItem(key, JSON.stringify(usage))
  }

  // Save generation record
  private async saveGeneration(generation: TokenGeneration): Promise<void> {
    const key = `generation_${generation.id}`
    localStorage.setItem(key, JSON.stringify(generation))
  }

  // Generate unique ID
  private generateId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Load token usage from localStorage
  private loadTokenUsage(): void {
    // Load total used tokens from localStorage
    const totalUsed = localStorage.getItem('total_tokens_used')
    if (totalUsed) {
      try {
        this.usedTokens = parseInt(totalUsed) || 0
      } catch {
        this.usedTokens = 0
      }
    }
  }

  // Start daily reset timer
  private startDailyReset(): void {
    setInterval(() => {
      this.resetDailyUsage()
    }, 60000) // Check every minute
  }

  // Reset daily usage for all users
  private resetDailyUsage(): void {
    const now = new Date()
    if (now.getUTCHours() === this.dailyResetHour && now.getUTCMinutes() === 0) {
      // Reset daily usage for all users
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('token_usage_')) {
          try {
            const usage = JSON.parse(localStorage.getItem(key) || '{}')
            if (this.shouldResetDaily(usage.lastReset)) {
              usage.dailyUsage = 0
              usage.lastReset = new Date().toISOString()
              localStorage.setItem(key, JSON.stringify(usage))
            }
          } catch {
            // Invalid data, skip
          }
        }
      })
    }
  }

  // Get token cost for generation type (simplified - photos only)
  public getTokenCost(type: 'photo', quality: 'hd' = 'hd'): number {
    return this.PHOTO_COST
  }

  // Check if user is rate limited
  private isRateLimited(userId: string): boolean {
    const lastGeneration = this.rateLimitCache.get(userId)
    if (!lastGeneration) return false
    
    const now = Date.now()
    return (now - lastGeneration) < (this.rateLimitWindow * 1000)
  }

  // Set rate limit for user
  private setRateLimit(userId: string): void {
    this.rateLimitCache.set(userId, Date.now())
  }

  // Track device usage
  private trackDeviceUsage(deviceId: string, userId: string): void {
    const users = this.deviceCache.get(deviceId) || []
    if (!users.includes(userId)) {
      users.push(userId)
      this.deviceCache.set(deviceId, users)
    }
  }

  // Check if daily reset is needed
  private shouldResetDaily(lastReset: string): boolean {
    const lastResetDate = new Date(lastReset)
    const now = new Date()
    const resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.dailyResetHour)
    
    return lastResetDate < resetDate
  }

  // Get daily limit (simplified - same for all users)
  public getDailyLimit(): number {
    return this.DAILY_LIMIT
  }

  // Get weekly limit (simplified - same for all users)
  public getWeeklyLimit(): number {
    return this.WEEKLY_LIMIT
  }

  // Get referral stats from backend (real data, not localStorage)
  async getReferralStats(userId: string): Promise<{ invites: number; tokensEarned: number; referralCode: string }> {
    try {
      // This should call the backend to get real referral data
      // For now, return placeholder data
      return {
        invites: 0,
        tokensEarned: 0,
        referralCode: `REF_${userId.slice(-6)}`
      }
    } catch (error) {
      console.error('Failed to get referral stats:', error)
      return {
        invites: 0,
        tokensEarned: 0,
        referralCode: `REF_${userId.slice(-6)}`
      }
    }
  }

  // Generate referral code
  async generateReferralCode(userId: string): Promise<string> {
    return `REF_${userId.slice(-6)}_${Date.now().toString(36)}`
  }

  // Anti-abuse: Check for multiple accounts from same device/IP
  async checkForAbuse(deviceId: string, ipAddress: string): Promise<{ isAbuse: boolean; reason?: string }> {
    // Check device usage
    const deviceUsers = this.deviceCache.get(deviceId) || []
    if (deviceUsers.length > 3) {
      return { isAbuse: true, reason: 'Too many accounts from same device' }
    }

    // Check IP usage (simplified - in production would use proper IP tracking)
    const ipUsers = Array.from(this.deviceCache.values()).flat()
    const ipCount = ipUsers.filter(userId => userId.includes(ipAddress)).length
    if (ipCount > 5) {
      return { isAbuse: true, reason: 'Too many accounts from same IP' }
    }

    return { isAbuse: false }
  }

  // Get service statistics
  getServiceStats(): { totalTokens: number; usedTokens: number; remainingTokens: number; usagePercentage: number } {
    const remaining = this.totalTokens - this.usedTokens
    const percentage = (this.usedTokens / this.totalTokens) * 100
    
    return {
      totalTokens: this.totalTokens,
      usedTokens: this.usedTokens,
      remainingTokens: remaining,
      usagePercentage: percentage
    }
  }

  // Emergency: Temporarily disable service
  emergencyDisable(): void {
    this.totalTokens = 0
    console.warn('Token service emergency disabled')
  }

  // Emergency: Restore service with new token count
  emergencyRestore(newTokenCount: number): void {
    this.totalTokens = newTokenCount
    console.log(`Token service restored with ${newTokenCount} tokens`)
  }
}

export default TokenService 