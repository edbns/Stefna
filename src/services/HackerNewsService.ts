export interface HackerNewsStory {
  id: number;
  title: string;
  url: string;
  by: string;
  score: number;
  time: number;
  descendants: number; // number of comments
  type: 'story';
  kids?: number[]; // comment IDs
  text?: string; // for text posts
  deleted?: boolean;
  dead?: boolean;
}

export interface HackerNewsResponse {
  stories: HackerNewsStory[];
  count: number;
  platform: 'hackernews';
}

class HackerNewsService {
  private static instance: HackerNewsService;
  private cache = new Map<string, { data: HackerNewsResponse; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly BASE_URL = 'https://hacker-news.firebaseio.com/v0';

  private constructor() {}

  static getInstance(): HackerNewsService {
    if (!HackerNewsService.instance) {
      HackerNewsService.instance = new HackerNewsService();
    }
    return HackerNewsService.instance;
  }

  async getTrendingStories(limit: number = 20): Promise<HackerNewsStory[]> {
    const cacheKey = `hackernews-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data.stories;
    }

    try {
      // Fetch top story IDs
      const topStoriesResponse = await fetch(`${this.BASE_URL}/topstories.json`);
      if (!topStoriesResponse.ok) {
        throw new Error(`HTTP ${topStoriesResponse.status}`);
      }
      
      const topStoryIds: number[] = await topStoriesResponse.json();
      
      // Fetch details for the first 'limit' stories
      const storyPromises = topStoryIds.slice(0, limit).map(async (id) => {
        const response = await fetch(`${this.BASE_URL}/item/${id}.json`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<HackerNewsStory>;
      });

      const stories = await Promise.all(storyPromises);
      
      // Filter out deleted/dead stories and ensure they're valid
      const validStories = stories.filter(story => 
        story && 
        !story.deleted && 
        !story.dead && 
        story.type === 'story' &&
        story.title
      );

      const response: HackerNewsResponse = {
        stories: validStories,
        count: validStories.length,
        platform: 'hackernews',
      };

      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      return validStories;
    } catch (error) {
      console.error('Error fetching Hacker News stories:', error);
      throw error;
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default HackerNewsService.getInstance(); 