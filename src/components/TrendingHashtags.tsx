import React, { useState, useEffect } from 'react';
import { Hash, ChevronDown, Bookmark, Heart, Monitor, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './FollowButton';

interface TrendingHashtag {
  id: string;
  hashtag: string;
  postCount: number;
  engagement: number;
  growth: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  platform?: string;
}

interface TrendingHashtagsProps {
  onAuthOpen?: () => void;
  onHashtagClick?: (hashtag: string) => void;
}

const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({ onAuthOpen, onHashtagClick }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fallback mock data
  const fallbackHashtags: TrendingHashtag[] = [
    { id: '1', hashtag: '#AI', postCount: 125000, engagement: 9.2, growth: '+45%', sentiment: 'positive', platform: 'twitter' },
    { id: '2', hashtag: '#TechNews', postCount: 89000, engagement: 7.8, growth: '+23%', sentiment: 'positive', platform: 'youtube' },
    { id: '3', hashtag: '#Viral', postCount: 156000, engagement: 12.5, growth: '+67%', sentiment: 'positive', platform: 'tiktok' },
    { id: '4', hashtag: '#Breaking', postCount: 78000, engagement: 15.2, growth: '+34%', sentiment: 'neutral', platform: 'twitter' },
    { id: '5', hashtag: '#Trending', postCount: 203000, engagement: 8.9, growth: '+28%', sentiment: 'positive', platform: 'instagram' },
    { id: '6', hashtag: '#Social', postCount: 67000, engagement: 6.7, growth: '+19%', sentiment: 'positive', platform: 'youtube' },
    { id: '7', hashtag: '#Innovation', postCount: 45000, engagement: 8.3, growth: '+15%', sentiment: 'positive', platform: 'linkedin' },
    { id: '8', hashtag: '#Digital', postCount: 52000, engagement: 7.1, growth: '+22%', sentiment: 'positive', platform: 'twitter' },
    { id: '9', hashtag: '#Future', postCount: 38000, engagement: 9.8, growth: '+31%', sentiment: 'positive', platform: 'tiktok' },
    { id: '10', hashtag: '#Tech', postCount: 94000, engagement: 6.9, growth: '+18%', sentiment: 'positive', platform: 'youtube' }
  ];

  const fetchTrendingHashtags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try multiple data sources
      const sources = [
        // Your local trending service
        '/.netlify/functions/trending-youtube',
        // Backup APIs (add more free endpoints here)
        'https://api.github.com/search/repositories?q=trending&sort=stars&order=desc&per_page=10'
      ];
      
      let data = null;
      
      for (const source of sources) {
        try {
          const response = await fetch(source, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            timeout: 5000
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (source.includes('netlify/functions')) {
              // Transform your backend data
              data = result.data?.filter((item: any) => item.type === 'hashtag')?.map((item: any, index: number) => ({
                id: `api-${index}`,
                hashtag: item.hashtag || item.title,
                postCount: Math.floor(Math.random() * 200000) + 10000,
                engagement: Math.floor(Math.random() * 15) + 5,
                growth: `+${Math.floor(Math.random() * 50) + 10}%`,
                sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
                platform: item.platform
              }));
            } else if (source.includes('github.com')) {
              // Transform GitHub trending data as hashtags
              data = result.items?.slice(0, 10)?.map((repo: any, index: number) => ({
                id: `gh-${index}`,
                hashtag: `#${repo.name.replace(/[^a-zA-Z0-9]/g, '')}`,
                postCount: repo.stargazers_count,
                engagement: Math.floor(Math.random() * 15) + 5,
                growth: `+${Math.floor(Math.random() * 50) + 10}%`,
                sentiment: 'positive' as const,
                platform: 'github'
              }));
            }
            
            if (data && data.length > 0) {
              break;
            }
          }
        } catch (sourceError) {
          console.warn(`Failed to fetch from ${source}:`, sourceError);
          continue;
        }
      }
      
      if (data && data.length > 0) {
        setHashtags(data.slice(0, 15)); // Limit to 15 hashtags
        setLastUpdated(new Date());
      } else {
        throw new Error('No data available from any source');
      }
      
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
      setError('Using fallback data');
      setHashtags(fallbackHashtags.slice(0, 15));
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingHashtags();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrendingHashtags, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const timeframes = [
    { id: '1h', label: 'Last Hour' },
    { id: '24h', label: 'Last 24 Hours' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' }
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'youtube': return '📺';
      case 'tiktok': return '🎵';
      case 'instagram': return '📷';
      case 'github': return '💻';
      default: return '🔥';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleHashtagClick = (hashtag: string) => {
    if (onHashtagClick) {
      onHashtagClick(hashtag);
    }
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = `Filtering by ${hashtag}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Hash className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">🔥 Trending Hashtags</h2>
          </div>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Hash className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">🔥 Trending Hashtags</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Fallback</span>
            </div>
          )}
          
          <button
            onClick={fetchTrendingHashtags}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeframes.map(timeframe => (
                <option key={timeframe.id} value={timeframe.id}>
                  {timeframe.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Hashtags Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hashtags.map((hashtag) => (
          <div
            key={hashtag.id}
            className="group p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getPlatformIcon(hashtag.platform)}</span>
                <button
                  onClick={() => handleHashtagClick(hashtag.hashtag)}
                  className="font-semibold text-gray-900 group-hover:text-blue-600 hover:underline"
                >
                  {hashtag.hashtag}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(hashtag.sentiment)}`}>
                  {hashtag.growth}
                </span>
                <FollowButton
                  type="hashtag"
                  item={hashtag.hashtag}
                  onAuthRequired={() => onAuthOpen?.()}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{formatNumber(hashtag.postCount)} posts</span>
              <span>{hashtag.engagement}% engagement</span>
            </div>
          </div>
        ))}
      </div>

      {hashtags.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Hash className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No trending hashtags available</p>
          <button
            onClick={fetchTrendingHashtags}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingHashtags;