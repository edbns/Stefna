export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  thumbnail: string | null;
  upvotes: number;
  url: string;
  author: string;
  created: number;
  numComments: number;
  isVideo: boolean;
  isSelf: boolean;
  domain: string;
}

export interface RedditResponse {
  posts: RedditPost[];
  count: number;
}

export class RedditService {
  private static instance: RedditService;
  private cache: RedditResponse | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): RedditService {
    if (!RedditService.instance) {
      RedditService.instance = new RedditService();
    }
    return RedditService.instance;
  }

  async getTrendingPosts(): Promise<RedditResponse> {
    // Check cache first
    const now = Date.now();
    if (this.cache && (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const response = await fetch('/.netlify/functions/fetchReddit', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RedditResponse = await response.json();
      
      // Cache the response
      this.cache = data;
      this.cacheTime = now;
      
      return data;
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      throw new Error('Failed to fetch Reddit trending posts');
    }
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }

  formatUpvotes(upvotes: number): string {
    if (upvotes >= 1000000) {
      return `${(upvotes / 1000000).toFixed(1)}M`;
    } else if (upvotes >= 1000) {
      return `${(upvotes / 1000).toFixed(1)}K`;
    }
    return upvotes.toString();
  }

  formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - (timestamp * 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  }
} 