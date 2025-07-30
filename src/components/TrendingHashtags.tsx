import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle, 
  Users,
  Activity,
  Target,
  Sparkles,
  ArrowUpRight,
  Clock,
  Filter,
  MessageSquare,
  Share2,
  Eye
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './FollowButton';

interface TrendingHashtag {
  id: string;
  name: string;
  postCount: number;
  engagement: number;
  growth: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  color: string;
  platforms: string[];
  relatedHashtags: string[];
  topPosts: number;
  reach: number;
}

interface TrendingHashtagsProps {
  onAuthOpen?: () => void;
  onHashtagClick?: (hashtag: string) => void;
}

const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({ onAuthOpen, onHashtagClick }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Enhanced fallback hashtags with colors and additional data
  const fallbackHashtags: TrendingHashtag[] = [
    { 
      id: '1', 
      name: '#AI', 
      postCount: 125000, 
      engagement: 12.5, 
      growth: '+45%', 
      sentiment: 'positive', 
      color: '#3B82F6',
      platforms: ['Twitter', 'LinkedIn', 'Reddit'],
      relatedHashtags: ['#MachineLearning', '#Tech', '#Innovation'],
      topPosts: 8500,
      reach: 2500000
    },
    { 
      id: '2', 
      name: '#ClimateAction', 
      postCount: 89000, 
      engagement: 18.2, 
      growth: '+32%', 
      sentiment: 'positive', 
      color: '#10B981',
      platforms: ['Instagram', 'Twitter', 'TikTok'],
      relatedHashtags: ['#Sustainability', '#Environment', '#Green'],
      topPosts: 6200,
      reach: 1800000
    },
    { 
      id: '3', 
      name: '#Gaming', 
      postCount: 156000, 
      engagement: 22.8, 
      growth: '+67%', 
      sentiment: 'positive', 
      color: '#EF4444',
      platforms: ['Twitch', 'YouTube', 'Reddit'],
      relatedHashtags: ['#Esports', '#Streaming', '#Gamers'],
      topPosts: 12000,
      reach: 3200000
    },
    { 
      id: '4', 
      name: '#Fashion', 
      postCount: 98000, 
      engagement: 15.4, 
      growth: '+28%', 
      sentiment: 'positive', 
      color: '#EC4899',
      platforms: ['Instagram', 'TikTok', 'Pinterest'],
      relatedHashtags: ['#Style', '#Trends', '#FashionWeek'],
      topPosts: 7500,
      reach: 2100000
    },
    { 
      id: '5', 
      name: '#Food', 
      postCount: 134000, 
      engagement: 19.6, 
      growth: '+41%', 
      sentiment: 'positive', 
      color: '#F97316',
      platforms: ['Instagram', 'TikTok', 'YouTube'],
      relatedHashtags: ['#Cooking', '#Recipes', '#Foodie'],
      topPosts: 9800,
      reach: 2800000
    },
    { 
      id: '6', 
      name: '#Travel', 
      postCount: 67000, 
      engagement: 14.8, 
      growth: '+23%', 
      sentiment: 'positive', 
      color: '#84CC16',
      platforms: ['Instagram', 'YouTube', 'TikTok'],
      relatedHashtags: ['#Adventure', '#Wanderlust', '#Explore'],
      topPosts: 4200,
      reach: 1500000
    },
    { 
      id: '7', 
      name: '#Music', 
      postCount: 112000, 
      engagement: 16.7, 
      growth: '+38%', 
      sentiment: 'positive', 
      color: '#F59E0B',
      platforms: ['TikTok', 'YouTube', 'Instagram'],
      relatedHashtags: ['#NewMusic', '#Concerts', '#Artists'],
      topPosts: 8900,
      reach: 2400000
    },
    { 
      id: '8', 
      name: '#Sports', 
      postCount: 89000, 
      engagement: 13.2, 
      growth: '+19%', 
      sentiment: 'positive', 
      color: '#06B6D4',
      platforms: ['Twitter', 'Instagram', 'YouTube'],
      relatedHashtags: ['#Football', '#Basketball', '#Olympics'],
      topPosts: 5600,
      reach: 1700000
    },
    { 
      id: '9', 
      name: '#Science', 
      postCount: 45000, 
      engagement: 9.8, 
      growth: '+15%', 
      sentiment: 'positive', 
      color: '#8B5CF6',
      platforms: ['YouTube', 'Reddit', 'Twitter'],
      relatedHashtags: ['#Research', '#Space', '#Discovery'],
      topPosts: 2800,
      reach: 900000
    },
    { 
      id: '10', 
      name: '#Politics', 
      postCount: 78000, 
      engagement: 11.4, 
      growth: '+52%', 
      sentiment: 'negative', 
      color: '#6B7280',
      platforms: ['Twitter', 'Reddit', 'YouTube'],
      relatedHashtags: ['#Elections', '#Policy', '#Debates'],
      topPosts: 4200,
      reach: 1200000
    }
  ];

  const fetchTrendingHashtags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try your local trending service first
      const response = await fetch('/.netlify/functions/trending-reddit', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Transform API data to hashtags
        const apiHashtags = result.data?.reduce((acc: any[], item: any) => {
          const hashtag = item.hashtag || '#' + item.title?.split(' ')[0] || 'General';
          const existing = acc.find(h => h.name === hashtag);
          
          if (existing) {
            existing.postCount += 1;
            existing.engagement = (existing.engagement + Math.random() * 5 + 5) / 2;
          } else {
            acc.push({
              id: `api-${acc.length}`,
              name: hashtag,
              postCount: Math.floor(Math.random() * 200000) + 10000,
              engagement: Math.floor(Math.random() * 20) + 5,
              growth: `+${Math.floor(Math.random() * 80) + 10}%`,
              sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
              color: ['#3B82F6', '#10B981', '#EF4444', '#EC4899', '#F97316', '#84CC16', '#F59E0B', '#06B6D4', '#8B5CF6', '#6B7280'][Math.floor(Math.random() * 10)],
              platforms: ['Twitter', 'Instagram', 'TikTok', 'YouTube', 'Reddit'].slice(0, Math.floor(Math.random() * 3) + 1),
              relatedHashtags: ['Related1', 'Related2', 'Related3'].slice(0, Math.floor(Math.random() * 2) + 1),
              topPosts: Math.floor(Math.random() * 15000) + 1000,
              reach: Math.floor(Math.random() * 5000000) + 500000
            });
          }
          
          return acc;
        }, []);
        
        if (apiHashtags && apiHashtags.length > 0) {
          setHashtags(apiHashtags.slice(0, 10));
          setLastUpdated(new Date());
        } else {
          throw new Error('No hashtags in API response');
        }
      } else {
        throw new Error('API request failed');
      }
      
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
      setError('Using fallback data');
      setHashtags(fallbackHashtags);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingHashtags();
  }, [selectedTimeframe]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleHashtagClick = (hashtagName: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtagName);
    }
  };

  const timeframes = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const filters = [
    { value: 'all', label: 'All Hashtags' },
    { value: 'positive', label: 'Positive Sentiment' },
    { value: 'negative', label: 'Negative Sentiment' },
    { value: 'high-engagement', label: 'High Engagement' }
  ];

  const filteredHashtags = hashtags.filter(hashtag => {
    if (selectedFilter === 'positive') return hashtag.sentiment === 'positive';
    if (selectedFilter === 'negative') return hashtag.sentiment === 'negative';
    if (selectedFilter === 'high-engagement') return hashtag.engagement > 15;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Trending Hashtags</h1>
          <p className="text-gray-600">Discover the most popular hashtags across all social platforms</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated?.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={fetchTrendingHashtags}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Timeframe:</span>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {timeframes.map(timeframe => (
              <option key={timeframe.value} value={timeframe.value}>
                {timeframe.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {filters.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Hash className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Total Posts</p>
              <p className="text-2xl font-bold">{formatNumber(hashtags.reduce((sum, hashtag) => sum + hashtag.postCount, 0))}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Avg Engagement</p>
              <p className="text-2xl font-bold">{((hashtags.reduce((sum, hashtag) => sum + hashtag.engagement, 0) / hashtags.length) || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Total Reach</p>
              <p className="text-2xl font-bold">{formatNumber(hashtags.reduce((sum, hashtag) => sum + hashtag.reach, 0))}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Top Growth</p>
              <p className="text-2xl font-bold">+67%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hashtags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHashtags.map((hashtag) => (
          <div
            key={hashtag.id}
            className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => handleHashtagClick(hashtag.name)}
          >
            {/* Hashtag Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: `${hashtag.color}20`, color: hashtag.color }}
                >
                  #
                </div>
                <div>
                  <h3 className="font-semibold text-black">{hashtag.name}</h3>
                  <p className="text-sm text-gray-500">{hashtag.platforms.join(', ')}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Posts</p>
                <p className="text-lg font-semibold text-black">{formatNumber(hashtag.postCount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-lg font-semibold text-black">{hashtag.engagement}%</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Reach</p>
                  <p className="text-sm font-medium text-black">{formatNumber(hashtag.reach)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Top Posts</p>
                  <p className="text-sm font-medium text-black">{formatNumber(hashtag.topPosts)}</p>
                </div>
              </div>
            </div>

            {/* Growth and Sentiment */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">{hashtag.growth}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(hashtag.sentiment)}`}>
                {hashtag.sentiment}
              </span>
            </div>

            {/* Related Hashtags */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Related Hashtags:</p>
              <div className="flex flex-wrap gap-1">
                {hashtag.relatedHashtags.map((related, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {related}
                  </span>
                ))}
              </div>
            </div>

            {/* Follow Button */}
            {user && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <FollowButton
                  type="hashtag"
                  item={hashtag.name}
                  onAuthRequired={onAuthOpen}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingHashtags;