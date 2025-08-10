// Token Management Service for AIML API
// Smart distribution system for 250 million tokens

export interface TokenUsage {
  userId: string
  dailyUsage: number
  dailyLimit: number
  lastReset: string
  totalUsage: number
  userTier: UserTier
  isRateLimited: boolean
  lastGeneration: string
}

export interface TokenGeneration {
  id: string
  userId: string
  type: 'photo' | 'video'
  quality: 'standard' | 'high'
  tokensUsed: number
  timestamp: string
  prompt: string
  ipAddress: string
  deviceId: string
}

export enum UserTier {
  REGISTERED = 'registered',
  VERIFIED = 'verified',
  CONTRIBUTOR = 'contributor'
}

export interface TokenLimits {
  [UserTier.REGISTERED]: number
  [UserTier.VERIFIED]: number
  [UserTier.CONTRIBUTOR]: number
}

export interface TokenCosts {
  photo: {
    standard: number
    high: number
  }
  video: {
    standard: number
    high: number
  }
}

class TokenService {
  private static instance: TokenService
  private totalTokens: number = 250_000_000
  private usedTokens: number = 0
  private rateLimitWindow: number = 30 // seconds
  private dailyResetHour: number = 0 // midnight UTC

  // Token limits per tier (client-side display only). Server enforces authoritative limits.
  private tokenLimits: TokenLimits = {
    [UserTier.REGISTERED]: 30,
    [UserTier.VERIFIED]: 60,
    [UserTier.CONTRIBUTOR]: 120
  }

  // Token costs per generation type - Always HD quality
  private tokenCosts: TokenCosts = {
    photo: {
      standard: 2, // Updated to match HD quality cost
      high: 2
    },
    video: {
      standard: 5, // Updated to match HD quality cost
      high: 5
    }
  }

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

  // Check if user can generate content
  async canGenerate(userId: string, userTier: UserTier, type: 'photo' | 'video', quality: 'standard' | 'high' = 'high'): Promise<{ canGenerate: boolean; reason?: string; remainingTokens?: number }> {
    const usage = await this.getUserUsage(userId)
    const cost = this.getTokenCost(type, quality)

    // Check rate limiting
    if (this.isRateLimited(userId)) {
      return { canGenerate: false, reason: 'Rate limited. Please wait 30 seconds between generations.' }
    }

    // Check daily limit
    if (usage.dailyUsage + cost > usage.dailyLimit) {
      return { 
        canGenerate: false, 
        reason: `Daily limit reached. You have ${usage.dailyLimit - usage.dailyUsage} tokens remaining.`,
        remainingTokens: usage.dailyLimit - usage.dailyUsage
      }
    }

    // Check total token availability
    if (this.usedTokens + cost > this.totalTokens) {
      return { canGenerate: false, reason: 'Service temporarily unavailable due to high demand.' }
    }

    return { canGenerate: true, remainingTokens: usage.dailyLimit - usage.dailyUsage - cost }
  }

  // Generate content and deduct tokens
  async generateContent(userId: string, userTier: UserTier, type: 'photo' | 'video', quality: 'standard' | 'high' = 'high', prompt: string, ipAddress: string, deviceId: string): Promise<{ success: boolean; tokensUsed: number; generationId?: string }> {
    const canGenerate = await this.canGenerate(userId, userTier, type, quality)
    
    if (!canGenerate.canGenerate) {
      return { success: false, tokensUsed: 0 }
    }

    const cost = this.getTokenCost(type, quality)
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

  // Get user's current usage
  async getUserUsage(userId: string): Promise<TokenUsage> {
    const saved = localStorage.getItem(`token_usage_${userId}`)
    if (saved) {
      const usage: TokenUsage = JSON.parse(saved)
      
      // Check if daily reset is needed
      if (this.shouldResetDaily(usage.lastReset)) {
        usage.dailyUsage = 0
        usage.lastReset = new Date().toISOString()
        await this.saveUserUsage(userId, usage)
      }
      
      return usage
    }

    // Create new usage record
    const usage: TokenUsage = {
      userId,
      dailyUsage: 0,
      dailyLimit: this.tokenLimits[UserTier.REGISTERED],
      lastReset: new Date().toISOString(),
      totalUsage: 0,
      userTier: UserTier.REGISTERED,
      isRateLimited: false,
      lastGeneration: ''
    }

    await this.saveUserUsage(userId, usage)
    return usage
  }

  // Update user tier (for engagement rewards)
  async updateUserTier(userId: string, newTier: UserTier): Promise<void> {
    // Clear existing cached data
    localStorage.removeItem(`token_usage_${userId}`)
    
    // Create new usage record with updated tier
    const usage: TokenUsage = {
      userId,
      dailyUsage: 0,
      dailyLimit: this.tokenLimits[newTier],
      lastReset: new Date().toISOString(),
      totalUsage: 0,
      userTier: newTier,
      isRateLimited: false,
      lastGeneration: ''
    }
    
    await this.saveUserUsage(userId, usage)
  }

  // Add bonus tokens (for engagement rewards)
  async addBonusTokens(userId: string, amount: number): Promise<void> {
    const usage = await this.getUserUsage(userId)
    usage.dailyLimit += amount
    await this.saveUserUsage(userId, usage)
  }

  // Invite system - generate referral code and track invites
  async generateReferralCode(userId: string): Promise<string> {
    const code = `STEFNA-${userId.slice(-6).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    // Save referral code
    const referrals = JSON.parse(localStorage.getItem('referral_codes') || '{}')
    referrals[code] = {
      userId,
      createdAt: new Date().toISOString(),
      invites: 0,
      tokensEarned: 0
    }
    localStorage.setItem('referral_codes', JSON.stringify(referrals))
    
    return code
  }

  // Process invite and award tokens
  async processInvite(referralCode: string, newUserId: string): Promise<{ success: boolean; tokensAwarded: number }> {
    const referrals = JSON.parse(localStorage.getItem('referral_codes') || '{}')
    const referral = referrals[referralCode]
    
    if (!referral) {
      return { success: false, tokensAwarded: 0 }
    }

    // Award tokens to referrer (50 tokens - increased from 10)
    const referrerTokens = 50
    await this.addBonusTokens(referral.userId, referrerTokens)
    
    // Award bonus tokens to new user (25 tokens - increased from 5)
    const newUserTokens = 25
    await this.addBonusTokens(newUserId, newUserTokens)
    
    // Update referral stats
    referral.invites += 1
    referral.tokensEarned += referrerTokens
    referrals[referralCode] = referral
    localStorage.setItem('referral_codes', JSON.stringify(referrals))
    
    return { success: true, tokensAwarded: referrerTokens + newUserTokens }
  }

  // Get user's referral stats
  async getReferralStats(userId: string): Promise<{ invites: number; tokensEarned: number; referralCode: string }> {
    const referrals = JSON.parse(localStorage.getItem('referral_codes') || '{}')
    
    for (const [code, data] of Object.entries(referrals)) {
      if ((data as any).userId === userId) {
        return {
          invites: (data as any).invites || 0,
          tokensEarned: (data as any).tokensEarned || 0,
          referralCode: code
        }
      }
    }
    
    // Generate new referral code if none exists
    const newCode = await this.generateReferralCode(userId)
    return {
      invites: 0,
      tokensEarned: 0,
      referralCode: newCode
    }
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

  // Get token cost for generation type
  public getTokenCost(type: 'photo' | 'video', quality: 'standard' | 'high'): number {
    return this.tokenCosts[type][quality]
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

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Save user usage to localStorage (in production would use database)
  async saveUserUsage(userId: string, usage: TokenUsage): Promise<void> {
    localStorage.setItem(`token_usage_${userId}`, JSON.stringify(usage))
  }

  // Save generation record (in production would use database)
  private async saveGeneration(generation: TokenGeneration): Promise<void> {
    const generations = JSON.parse(localStorage.getItem('token_generations') || '[]')
    generations.push(generation)
    localStorage.setItem('token_generations', JSON.stringify(generations))
  }

  // Load token usage from localStorage
  private loadTokenUsage(): void {
    const saved = localStorage.getItem('total_used_tokens')
    if (saved) {
      this.usedTokens = parseInt(saved)
    }
  }

  // Start daily reset timer
  private startDailyReset(): void {
    setInterval(() => {
      const now = new Date()
      if (now.getUTCHours() === this.dailyResetHour && now.getUTCMinutes() === 0) {
        this.resetAllDailyUsage()
      }
    }, 60000) // Check every minute
  }

  // Reset all users' daily usage
  private resetAllDailyUsage(): void {
    // In production, this would iterate through all users in the database
    // For now, we'll rely on individual user checks
    console.log('Daily token reset completed')
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

export default TokenService.getInstance() 