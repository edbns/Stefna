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
      const response = await fetch('/.netlify/functions/ai-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'caption',
          content,
          platform
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.incrementQuota();
        return {
          success: true,
          result: data.result,
          provider: data.provider || 'AI Service',
          quotaUsed: 1,
          remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to generate caption',
          provider: 'AI Service',
          quotaUsed: 0,
          remainingQuota: quota.dailyLimit - quota.dailyUsed
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate caption. Please try again.',
        provider: 'AI Service',
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
      const response = await fetch('/.netlify/functions/ai-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tweet',
          content,
          style
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.incrementQuota();
        return {
          success: true,
          result: data.result,
          provider: data.provider || 'AI Service',
          quotaUsed: 1,
          remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to generate tweet',
          provider: 'AI Service',
          quotaUsed: 0,
          remainingQuota: quota.dailyLimit - quota.dailyUsed
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate tweet. Please try again.',
        provider: 'AI Service',
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
      const response = await fetch('/.netlify/functions/ai-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sentiment',
          content
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.incrementQuota();
        return {
          success: true,
          result: data.result,
          provider: data.provider || 'AI Service',
          quotaUsed: 1,
          remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to analyze sentiment',
          provider: 'AI Service',
          quotaUsed: 0,
          remainingQuota: quota.dailyLimit - quota.dailyUsed
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to analyze sentiment. Please try again.',
        provider: 'AI Service',
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
      const response = await fetch('/.netlify/functions/ai-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hashtags',
          content,
          platform
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.incrementQuota();
        return {
          success: true,
          result: data.result,
          provider: data.provider || 'AI Service',
          quotaUsed: 1,
          remainingQuota: quota.dailyLimit - quota.dailyUsed - 1
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to generate hashtags',
          provider: 'AI Service',
          quotaUsed: 0,
          remainingQuota: quota.dailyLimit - quota.dailyUsed
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate hashtags. Please try again.',
        provider: 'AI Service',
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