import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ChevronDown, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp,
  Users,
  Activity,
  Target,
  Sparkles,
  ArrowUpRight,
  Clock,
  Filter
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './FollowButton';

interface TrendingCategory {
  id: string;
  name: string;
  postVolume: number;
  engagement: number;
  growth: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  icon?: string;
  color: string;
  platforms: string[];
  trendingTopics: string[];
}

interface TrendingCategoriesProps {
  onAuthOpen?: () => void;
  onCategoryClick?: (category: string) => void;
}

const TrendingCategories: React.FC<TrendingCategoriesProps> = ({ onAuthOpen, onCategoryClick }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [categories, setCategories] = useState<TrendingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Enhanced fallback categories with colors and additional data
  const fallbackCategories: TrendingCategory[] = [
    { 
      id: '1', 
      name: 'Technology', 
      postVolume: 45200, 
      engagement: 8.7, 
      growth: '+23%', 
      sentiment: 'positive', 
      icon: '💻',
      color: '#3B82F6',
      platforms: ['YouTube', 'Twitter', 'Reddit'],
      trendingTopics: ['AI', 'Web3', 'Cybersecurity']
    },
    { 
      id: '2', 
      name: 'Entertainment', 
      postVolume: 52100, 
      engagement: 15.2, 
      growth: '+18%', 
      sentiment: 'positive', 
      icon: '🎬',
      color: '#8B5CF6',
      platforms: ['TikTok', 'Instagram', 'YouTube'],
      trendingTopics: ['Movies', 'Celebrities', 'Streaming']
    },
    { 
      id: '3', 
      name: 'Sports', 
      postVolume: 29800, 
      engagement: 11.8, 
      growth: '+12%', 
      sentiment: 'positive', 
      icon: '⚽',
      color: '#10B981',
      platforms: ['Twitter', 'Instagram', 'YouTube'],
      trendingTopics: ['Football', 'Basketball', 'Olympics']
    },
    { 
      id: '4', 
      name: 'Music', 
      postVolume: 34500, 
      engagement: 14.5, 
      growth: '+28%', 
      sentiment: 'positive', 
      icon: '🎵',
      color: '#F59E0B',
      platforms: ['TikTok', 'YouTube', 'Instagram'],
      trendingTopics: ['New Releases', 'Concerts', 'Artists']
    },
    { 
      id: '5', 
      name: 'Gaming', 
      postVolume: 27300, 
      engagement: 16.8, 
      growth: '+35%', 
      sentiment: 'positive', 
      icon: '🎮',
      color: '#EF4444',
      platforms: ['Twitch', 'YouTube', 'Reddit'],
      trendingTopics: ['Esports', 'New Games', 'Streamers']
    },
    { 
      id: '6', 
      name: 'Politics', 
      postVolume: 38900, 
      engagement: 12.3, 
      growth: '+45%', 
      sentiment: 'negative', 
      icon: '🏛️',
      color: '#6B7280',
      platforms: ['Twitter', 'Reddit', 'YouTube'],
      trendingTopics: ['Elections', 'Policy', 'Debates']
    },
    { 
      id: '7', 
      name: 'Science', 
      postVolume: 19500, 
      engagement: 9.2, 
      growth: '+21%', 
      sentiment: 'positive', 
      icon: '🔬',
      color: '#06B6D4',
      platforms: ['YouTube', 'Reddit', 'Twitter'],
      trendingTopics: ['Research', 'Space', 'Climate']
    },
    { 
      id: '8', 
      name: 'Fashion', 
      postVolume: 22100, 
      engagement: 13.7, 
      growth: '+16%', 
      sentiment: 'positive', 
      icon: '👗',
      color: '#EC4899',
      platforms: ['Instagram', 'TikTok', 'Pinterest'],
      trendingTopics: ['Trends', 'Designers', 'Shows']
    },
    { 
      id: '9', 
      name: 'Food', 
      postVolume: 31200, 
      engagement: 18.4, 
      growth: '+24%', 
      sentiment: 'positive', 
      icon: '🍕',
      color: '#F97316',
      platforms: ['Instagram', 'TikTok', 'YouTube'],
      trendingTopics: ['Recipes', 'Restaurants', 'Cooking']
    },
    { 
      id: '10', 
      name: 'Travel', 
      postVolume: 18700, 
      engagement: 11.1, 
      growth: '+19%', 
      sentiment: 'positive', 
      icon: '✈️',
      color: '#84CC16',
      platforms: ['Instagram', 'YouTube', 'TikTok'],
      trendingTopics: ['Destinations', 'Tips', 'Adventures']
    }
  ];

  const fetchTrendingCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try your local trending service first
      const response = await fetch('/.netlify/functions/trending-youtube', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Transform API data to categories
        const apiCategories = result.data?.reduce((acc: any[], item: any) => {
          const category = item.category || 'General';
          const existing = acc.find(c => c.name === category);
          
          if (existing) {
            existing.postVolume += 1;
            existing.engagement = (existing.engagement + Math.random() * 5 + 5) / 2;
          } else {
            acc.push({
              id: `api-${acc.length}`,
              name: category,
              postVolume: Math.floor(Math.random() * 50000) + 10000,
              engagement: Math.floor(Math.random() * 15) + 5,
              growth: `+${Math.floor(Math.random() * 50) + 10}%`,
              sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
              icon: ['💻', '🎬', '⚽', '🎵', '🎮', '🏛️', '🔬', '👗', '🍕', '✈️'][Math.floor(Math.random() * 10)],
              color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#06B6D4', '#EC4899', '#F97316', '#84CC16'][Math.floor(Math.random() * 10)],
              platforms: ['YouTube', 'Twitter', 'Instagram', 'TikTok', 'Reddit'].slice(0, Math.floor(Math.random() * 3) + 1),
              trendingTopics: ['Topic 1', 'Topic 2', 'Topic 3'].slice(0, Math.floor(Math.random() * 2) + 1)
            });
          }
          
          return acc;
        }, []);
        
        if (apiCategories && apiCategories.length > 0) {
          setCategories(apiCategories.slice(0, 10));
          setLastUpdated(new Date());
        } else {
          throw new Error('No categories in API response');
        }
      } else {
        throw new Error('API request failed');
      }
      
    } catch (err) {
      console.error('Error fetching trending categories:', err);
      setError('Using fallback data');
      setCategories(fallbackCategories);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingCategories();
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

  const handleCategoryClick = (categoryName: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryName);
    }
  };

  const timeframes = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const filters = [
    { value: 'all', label: 'All Categories' },
    { value: 'positive', label: 'Positive Sentiment' },
    { value: 'negative', label: 'Negative Sentiment' },
    { value: 'high-engagement', label: 'High Engagement' }
  ];

  const filteredCategories = categories.filter(category => {
    if (selectedFilter === 'positive') return category.sentiment === 'positive';
    if (selectedFilter === 'negative') return category.sentiment === 'negative';
    if (selectedFilter === 'high-engagement') return category.engagement > 12;
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
          <h1 className="text-3xl font-bold text-black mb-2">Trending Categories</h1>
          <p className="text-gray-600">Discover the most popular content categories across all platforms</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated?.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={fetchTrendingCategories}
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
            <TrendingUp className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Total Posts</p>
              <p className="text-2xl font-bold">{formatNumber(categories.reduce((sum, cat) => sum + cat.postVolume, 0))}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Avg Engagement</p>
              <p className="text-2xl font-bold">{((categories.reduce((sum, cat) => sum + cat.engagement, 0) / categories.length) || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Active Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Top Growth</p>
              <p className="text-2xl font-bold">+45%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => handleCategoryClick(category.name)}
          >
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-black">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.platforms.join(', ')}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Posts</p>
                <p className="text-lg font-semibold text-black">{formatNumber(category.postVolume)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Engagement</p>
                <p className="text-lg font-semibold text-black">{category.engagement}%</p>
              </div>
            </div>

            {/* Growth and Sentiment */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">{category.growth}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(category.sentiment)}`}>
                {category.sentiment}
              </span>
            </div>

            {/* Trending Topics */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Trending Topics:</p>
              <div className="flex flex-wrap gap-1">
                {category.trendingTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Follow Button */}
            {user && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                                 <FollowButton
                   type="category"
                   item={category.name}
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

export default TrendingCategories;