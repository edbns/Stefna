// Add FollowButton import at the top
import React, { useState, useEffect } from 'react';
import { BarChart3, ChevronDown, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
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
}

interface TrendingCategoriesProps {
  onAuthOpen?: () => void;
  onCategoryClick?: (category: string) => void;
}

const TrendingCategories: React.FC<TrendingCategoriesProps> = ({ onAuthOpen, onCategoryClick }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [categories, setCategories] = useState<TrendingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Enhanced fallback categories with icons
  const fallbackCategories: TrendingCategory[] = [
    { id: '1', name: 'Technology', postVolume: 45200, engagement: 8.7, growth: '+23%', sentiment: 'positive', icon: '💻' },
    { id: '2', name: 'Entertainment', postVolume: 52100, engagement: 15.2, growth: '+18%', sentiment: 'positive', icon: '🎬' },
    { id: '3', name: 'Sports', postVolume: 29800, engagement: 11.8, growth: '+12%', sentiment: 'positive', icon: '⚽' },
    { id: '4', name: 'Music', postVolume: 34500, engagement: 14.5, growth: '+28%', sentiment: 'positive', icon: '🎵' },
    { id: '5', name: 'Gaming', postVolume: 27300, engagement: 16.8, growth: '+35%', sentiment: 'positive', icon: '🎮' },
    { id: '6', name: 'Politics', postVolume: 38900, engagement: 12.3, growth: '+45%', sentiment: 'negative', icon: '🏛️' },
    { id: '7', name: 'Science', postVolume: 19500, engagement: 9.2, growth: '+21%', sentiment: 'positive', icon: '🔬' },
    { id: '8', name: 'Fashion', postVolume: 22100, engagement: 13.7, growth: '+16%', sentiment: 'positive', icon: '👗' },
    { id: '9', name: 'Food', postVolume: 31200, engagement: 18.4, growth: '+24%', sentiment: 'positive', icon: '🍕' },
    { id: '10', name: 'Travel', postVolume: 18700, engagement: 11.1, growth: '+19%', sentiment: 'positive', icon: '✈️' }
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
        },
        timeout: 5000
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
              icon: ['💻', '🎬', '⚽', '🎵', '🎮', '🏛️', '🔬', '👗', '🍕', '✈️'][Math.floor(Math.random() * 10)]
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
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrendingCategories, 5 * 60 * 1000);
    
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleCategoryClick = (categoryName: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryName);
    }
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = `Filtering by ${categoryName}`;
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
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">🗂️ Popular Categories</h2>
          </div>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
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
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">🗂️ Popular Categories</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Fallback</span>
            </div>
          )}
          
          <button
            onClick={fetchTrendingCategories}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-purple-100 border border-gray-200 hover:border-purple-300 rounded-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <button
                  onClick={() => handleCategoryClick(category.name)}
                  className="font-semibold text-gray-900 group-hover:text-purple-600 hover:underline text-left"
                >
                  {category.name}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                <FollowButton
                  type="category"
                  item={category.name}
                  onAuthRequired={() => onAuthOpen?.()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium">{formatNumber(category.postVolume)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Engagement:</span>
                <span className="font-medium">{category.engagement}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(category.sentiment)}`}>
                  {category.growth}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No trending categories available</p>
          <button
            onClick={fetchTrendingCategories}
            className="mt-2 text-purple-600 hover:text-purple-700 text-sm"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingCategories;