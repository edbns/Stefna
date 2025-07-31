export interface Content {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: 'youtube' | 'bluesky' | 'hackernews';
  creator: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  trendingScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  hashtags: string[];
  publishedAt: string;
  url: string;
  aiSummary?: string; // Added back for compatibility
  location?: string;
}