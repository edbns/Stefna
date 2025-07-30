import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TrendingPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  platform: string;
  content: {
    text: string;
    media?: {
      type: 'video' | 'image';
      url: string;
      thumbnail?: string;
    };
  };
  engagement: {
    likes: number;
    views: number;
    comments: number;
    shares: number;
  };
  trendingScore: number;
  hashtags: string[];
  location?: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

const Trending: React.FC = () => {
  const { t } = useLanguage();
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'engagement' | 'recency'>('engagement');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  // Mock data with video content
  const mockTrendingPosts: TrendingPost[] = [
    {
      id: '1',
      author: {
        username: 'techguru2024',
        displayName: 'Tech Guru',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        verified: true
      },
      platform: 'youtube',
      content: {
        text: 'Revolutionary AI breakthrough that will change everything! 🚀 #AI #Technology #Future',
        media: {
          type: 'video',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
        }
      },
      engagement: { likes: 125000, views: 2500000, comments: 8500, shares: 15000 },
      trendingScore: 98,
      hashtags: ['#AI', '#Technology', '#Future'],
      location: 'San Francisco, CA',
      timestamp: '2024-01-15T10:30:00Z',
      sentiment: 'positive'
    },
    {
      id: '2',
      author: {
        username: 'dancequeen',
        displayName: 'Dance Queen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        verified: false
      },
      platform: 'tiktok',
      content: {
        text: 'New dance trend taking over! Can you do it? 💃 #DanceChallenge #Viral #TikTok',
        media: {
          type: 'video',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
        }
      },
      engagement: { likes: 89000, views: 1800000, comments: 12000, shares: 25000 },
      trendingScore: 95,
      hashtags: ['#DanceChallenge', '#Viral', '#TikTok'],
      timestamp: '2024-01-15T08:15:00Z',
      sentiment: 'positive'
    }
  ];

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let posts = [...mockTrendingPosts];
        
        // Apply sorting
        if (sortBy === 'engagement') {
          posts.sort((a, b) => b.trendingScore - a.trendingScore);
        } else {
          posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        
        setTrendingPosts(posts);
        setHasMore(posts.length >= 10);
      } catch (err) {
        setError('Failed to load trending posts');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPosts();
  }, [selectedTimeframe, selectedCategory, sortBy]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      // Simulate loading more posts
      setTimeout(() => {
        setTrendingPosts(prev => [...prev, ...mockTrendingPosts.slice(0, 2)]);
        setHasMore(false); // For demo purposes
      }, 1000);
    }
  }, [loading, hasMore]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Trending Content</h1>
      <div className="space-y-4">
        {trendingPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start space-x-3">
              <img
                src={post.author.avatar}
                alt={post.author.displayName}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{post.author.displayName}</span>
                  {post.author.verified && (
                    <span className="text-blue-500">✓</span>
                  )}
                  <span className="text-gray-500 text-sm">@{post.author.username}</span>
                </div>
                <p className="text-gray-800 mt-1">{post.content.text}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>❤️ {formatNumber(post.engagement.likes)}</span>
                  <span>👁️ {formatNumber(post.engagement.views)}</span>
                  <span>💬 {formatNumber(post.engagement.comments)}</span>
                  <span>📤 {formatNumber(post.engagement.shares)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Trending;