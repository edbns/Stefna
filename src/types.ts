export interface Content {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: 'youtube' | 'tiktok' | 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'reddit' | 'twitch';
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
  // aiSummary: string; // Removed to reduce OpenRouter API usage
  location?: string;
}