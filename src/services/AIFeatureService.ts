import AIService from './AIService';

export interface AIFeatureRequest {
  type: 'caption' | 'tweet' | 'reddit' | 'title' | 'rewrite' | 'bio' | 'image' | 'meme' | 'sentiment' | 'hashtags' | 'poll' | 'comment';
  content: string;
  platform?: string;
  context?: string;
  style?: string;
}

export interface AIFeatureResponse {
  success: boolean;
  result?: string;
  error?: string;
  provider: string;
  quotaUsed: number;
  remainingQuota: number;
}

export interface QuotaInfo {
  dailyUsed: number;
  dailyLimit: number;
  isRegistered: boolean;
  canUseFeature: boolean;
}

class AIFeatureService {
  private static instance: AIFeatureService;
  private aiService: AIService;
  private quotaKey = 'stefna_ai_quota';
  private lastResetKey = 'stefna_ai_last_reset';

  private constructor() {
    this.aiService = AIService.getInstance();
  }

  static getInstance(): AIFeatureService {
    if (!AIFeatureService.instance) {
      AIFeatureService.instance = new AIFeatureService();
    }
    return AIFeatureService.instance;
  }

  // Quota Management
  private getQuotaInfoInternal(): QuotaInfo {
    const stored = localStorage.getItem(this.quotaKey);
    const lastReset = localStorage.getItem(this.lastResetKey);
    const today = new Date().toDateString();
    
    // Reset quota if it's a new day
    if (lastReset !== today) {
      localStorage.setItem(this.lastResetKey, today);
      localStorage.setItem(this.quotaKey, '0');
    }

    const dailyUsed = stored ? parseInt(stored) : 0;
    const dailyLimit = 10; // Free users: 10/day, Registered: 50/day (handled in UI)
    
    return {
      dailyUsed,
      dailyLimit,
      isRegistered: false, // Will be updated based on auth state
      canUseFeature: dailyUsed < dailyLimit
    };
  }

  private incrementQuota(): void {
    const quota = this.getQuotaInfoInternal();
    localStorage.setItem(this.quotaKey, (quota.dailyUsed + 1).toString());
  }

  // AI Feature Generators
  async generateCaption(content: string, platform: 'tiktok' | 'youtube' | 'instagram' = 'instagram'): Promise<AIFeatureResponse> {
    const quota = this.getQuotaInfoInternal();
    if (!quota.canUseFeature) {
      return {
        success: false,
        error: 'Daily AI quota exceeded. Come back tomorrow or invite friends for more!',
        provider: 'none',
        quotaUsed: 0,
        remainingQuota: 0
      };
    }

    try {
      const prompt = `Generate a viral ${platform} caption for this content: "${content}". 
      Make it engaging, use relevant hashtags, and include a call-to-action. 
      Keep it under 220 characters for ${platform}.`;

      const result = await this.aiService.chat(prompt);
      this.incrementQuota();

      return {
        success: true,
        result,
        provider: 'AIMLAPI',
        quotaUsed: 1,
        remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate caption. Please try again.',
        provider: 'AIMLAPI',
        quotaUsed: 0,
        remainingQuota: quota.dailyLimit - quota.dailyUsed
      };
    }
  }

  async generateTweet(content: string, style: 'viral' | 'informative' | 'funny' = 'viral'): Promise<AIFeatureResponse> {
    const quota = this.getQuotaInfoInternal();
    if (!quota.canUseFeature) {
      return {
        success: false,
        error: 'Daily AI quota exceeded. Come back tomorrow or invite friends for more!',
        provider: 'none',
        quotaUsed: 0,
        remainingQuota: 0
      };
    }

    try {
      const prompt = `Generate a ${style} tweet about: "${content}". 
      Make it engaging, include relevant hashtags, and keep it under 280 characters. 
      Make it shareable and viral-worthy.`;

      const result = await this.aiService.chat(prompt);
      this.incrementQuota();

      return {
        success: true,
        result,
        provider: 'AIMLAPI',
        quotaUsed: 1,
        remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate tweet. Please try again.',
        provider: 'AIMLAPI',
        quotaUsed: 0,
        remainingQuota: quota.dailyLimit - quota.dailyUsed
      };
    }
  }

  async generateRedditPost(content: string, subreddit: string = 'general'): Promise<AIFeatureResponse> {
    const quota = this.getQuotaInfoInternal();
    if (!quota.canUseFeature) {
      return {
        success: false,
        error: 'Daily AI quota exceeded. Come back tomorrow or invite friends for more!',
        provider: 'none',
        quotaUsed: 0,
        remainingQuota: 0
      };
    }

    try {
      const prompt = `Generate a Reddit post for r/${subreddit} about: "${content}". 
      Make it engaging, include a title and body text. 
      Follow Reddit's style and community guidelines.`;

      const result = await this.aiService.chat(prompt);
      this.incrementQuota();

      return {
        success: true,
        result,
        provider: 'AIMLAPI',
        quotaUsed: 1,
        remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate Reddit post. Please try again.',
        provider: 'AIMLAPI',
        quotaUsed: 0,
        remainingQuota: quota.dailyLimit - quota.dailyUsed
      };
    }
  }

  async generateVideoTitle(content: string, platform: 'youtube' | 'tiktok' = 'youtube'): Promise<AIFeatureResponse> {
    const quota = this.getQuotaInfoInternal();
    if (!quota.canUseFeature) {
      return {
        success: false,
        error: 'Daily AI quota exceeded. Come back tomorrow or invite friends for more!',
        provider: 'none',
        quotaUsed: 0,
        remainingQuota: 0
      };
    }

    try {
      const prompt = `Generate a catchy ${platform} video title about: "${content}". 
      Make it clickbait-worthy but not misleading. 
      Include relevant keywords and keep it under 60 characters.`;

      const result = await this.aiService.chat(prompt);
      this.incrementQuota();

      return {
        success: true,
        result,
        provider: 'AIMLAPI',
        quotaUsed: 1,
        remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate video title. Please try again.',
        provider: 'AIMLAPI',
        quotaUsed: 0,
        remainingQuota: quota.dailyLimit - quota.dailyUsed
      };
    }
  }

  async analyzeSentiment(content: string): Promise<AIFeatureResponse> {
    const quota = this.getQuotaInfoInternal();
    if (!quota.canUseFeature) {
      return {
        success: false,
        error: 'Daily AI quota exceeded. Come back tomorrow or invite friends for more!',
        provider: 'none',
        quotaUsed: 0,
        remainingQuota: 0
      };
    }

    try {
      const prompt = `Analyze the sentiment and virality potential of this content: "${content}". 
      Provide insights on:
      1. Sentiment (positive/negative/neutral)
      2. Viral potential (1-10 scale)
      3. Why it might go viral
      4. Target audience
      5. Suggested platforms for maximum reach`;

      const result = await this.aiService.chat(prompt);
      this.incrementQuota();

      return {
        success: true,
        result,
        provider: 'AIMLAPI',
        quotaUsed: 1,
        remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to analyze sentiment. Please try again.',
        provider: 'AIMLAPI',
        quotaUsed: 0,
        remainingQuota: quota.dailyLimit - quota.dailyUsed
      };
    }
  }

  async generateHashtags(content: string, platform: 'instagram' | 'tiktok' | 'twitter' = 'instagram'): Promise<AIFeatureResponse> {
    const quota = this.getQuotaInfoInternal();
    if (!quota.canUseFeature) {
      return {
        success: false,
        error: 'Daily AI quota exceeded. Come back tomorrow or invite friends for more!',
        provider: 'none',
        quotaUsed: 0,
        remainingQuota: 0
      };
    }

    try {
      const prompt = `Generate 10 relevant hashtags for ${platform} about: "${content}". 
      Mix popular and niche hashtags. 
      Include trending hashtags if relevant. 
      Format as: #hashtag1 #hashtag2 #hashtag3...`;

      const result = await this.aiService.chat(prompt);
      this.incrementQuota();

      return {
        success: true,
        result,
        provider: 'AIMLAPI',
        quotaUsed: 1,
        remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate hashtags. Please try again.',
        provider: 'AIMLAPI',
        quotaUsed: 0,
        remainingQuota: quota.dailyLimit - quota.dailyUsed
      };
    }
  }

  // Quota and Usage Methods
  getQuotaInfo(): QuotaInfo {
    const stored = localStorage.getItem(this.quotaKey);
    const lastReset = localStorage.getItem(this.lastResetKey);
    const today = new Date().toDateString();
    
    // Reset quota if it's a new day
    if (lastReset !== today) {
      localStorage.setItem(this.lastResetKey, today);
      localStorage.setItem(this.quotaKey, '0');
    }

    const dailyUsed = stored ? parseInt(stored) : 0;
    const dailyLimit = 10; // Free users: 10/day, Registered: 50/day (handled in UI)
    
    return {
      dailyUsed,
      dailyLimit,
      isRegistered: false, // Will be updated based on auth state
      canUseFeature: dailyUsed < dailyLimit
    };
  }

  resetQuota(): void {
    localStorage.removeItem(this.quotaKey);
    localStorage.removeItem(this.lastResetKey);
  }

  // Generic AI Feature Handler
  async executeFeature(request: AIFeatureRequest): Promise<AIFeatureResponse> {
    switch (request.type) {
      case 'caption':
        return this.generateCaption(request.content, request.platform as any);
      case 'tweet':
        return this.generateTweet(request.content, request.style as any);
      case 'reddit':
        return this.generateRedditPost(request.content, request.platform);
      case 'title':
        return this.generateVideoTitle(request.content, request.platform as any);
      case 'sentiment':
        return this.analyzeSentiment(request.content);
      case 'hashtags':
        return this.generateHashtags(request.content, request.platform as any);
      default:
        return {
          success: false,
          error: 'Feature not implemented yet.',
          provider: 'none',
          quotaUsed: 0,
          remainingQuota: 0
        };
    }
  }
}

export default AIFeatureService; 