export interface BlueskyPost {
  id: string;
  platform: 'bluesky';
  title: string;
  description: string;
  author: {
    name: string;
    username: string;
    avatar: string | null;
    verified: boolean;
  };
  engagement: {
    likes: number;
    reposts: number;
    replies: number;
    views: number;
  };
  media: {
    type: 'image';
    url: string;
    alt: string;
  } | null;
  hashtags: string[];
  timestamp: string;
  url: string;
  trendingScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface BlueskyResponse {
  posts: BlueskyPost[];
  count: number;
  platform: 'bluesky';
  hashtag: string | null;
}

class BlueskyService {
  private static instance: BlueskyService;
  private cache = new Map<string, { data: BlueskyResponse; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): BlueskyService {
    if (!BlueskyService.instance) {
      BlueskyService.instance = new BlueskyService();
    }
    return BlueskyService.instance;
  }

  async getTrendingPosts(limit: number = 20, hashtag?: string): Promise<BlueskyPost[]> {
    const cacheKey = `bluesky-${hashtag || 'global'}-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data.posts;
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (hashtag) {
        params.append('hashtag', hashtag);
      }

      const response = await fetch(`/.netlify/functions/bluesky-trending?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: BlueskyResponse = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data.posts;
    } catch (error) {
      console.error('Error fetching Bluesky posts:', error);
      throw error;
    }
  }

  async getPostsByHashtag(hashtag: string, limit: number = 20): Promise<BlueskyPost[]> {
    return this.getTrendingPosts(limit, hashtag);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default BlueskyService.getInstance(); 