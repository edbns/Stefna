import React, { useState, useEffect } from 'react';
import { Hash, TrendingUp, Calendar, BarChart3, Plus, Search, Filter, Eye, Bookmark, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TrackedTrend {
  id: string;
  name: string;
  hashtag: string;
  category: string;
  platforms: string[];
  metrics: {
    totalPosts: number;
    totalViews: number;
    totalEngagement: number;
    averageEngagement: number;
    peakDay: string;
    currentVolume: number;
  };
  historicalData: {
    date: string;
    posts: number;
    views: number;
    engagement: number;
  }[];
  alerts: {
    volumeSpike: boolean;
    engagementDrop: boolean;
    newPlatform: boolean;
  };
  createdAt: string;
  lastUpdated: string;
}

const TrendTracking: React.FC = () => {
  const { t } = useLanguage();
  const [trackedTrends, setTrackedTrends] = useState<TrackedTrend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false); // Add this missing state
  const [newTrendData, setNewTrendData] = useState({
    name: '',
    hashtag: '',
    category: 'general',
    platforms: ['youtube'] as string[]
  });

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        // For now, set empty array until real API is implemented
        setTrackedTrends([]);
      } catch (err) {
        console.error('Error fetching trends:', err);
        setTrackedTrends([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchTrends();
  }, []);

  const handleAddTrend = () => {
    if (newTrendData.name && newTrendData.hashtag) {
      const newTrend: TrackedTrend = {
        id: Date.now().toString(),
        name: newTrendData.name,
        hashtag: newTrendData.hashtag.startsWith('#') ? newTrendData.hashtag : `#${newTrendData.hashtag}`,
        category: newTrendData.category,
        platforms: newTrendData.platforms,
        metrics: {
          totalPosts: Math.floor(Math.random() * 10000) + 1000,
          totalViews: Math.floor(Math.random() * 5000000) + 500000,
          totalEngagement: Math.floor(Math.random() * 200000) + 20000,
          averageEngagement: Math.random() * 10 + 2,
          peakDay: new Date().toISOString().split('T')[0],
          currentVolume: Math.floor(Math.random() * 1000) + 100
        },
        historicalData: [],
        alerts: {
          volumeSpike: false,
          engagementDrop: false,
          newPlatform: false
        },
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString()
      };
      
      setTrackedTrends(prev => [...prev, newTrend]);
      setNewTrendData({ name: '', hashtag: '', category: 'general', platforms: ['youtube'] });
      setShowAddModal(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'tiktok': return 'bg-gray-100 text-gray-800';
      case 'twitter': return 'bg-blue-100 text-blue-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTrends = trackedTrends.filter(trend => {
    const matchesSearch = trend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trend.hashtag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || trend.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hash className="w-8 h-8 text-button" />
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            Trend Tracking
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-button text-white px-4 py-2 rounded-lg hover:bg-button/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Track New Trend
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search trends or hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="technology">Technology</option>
          <option value="lifestyle">Lifestyle</option>
          <option value="entertainment">Entertainment</option>
          <option value="sports">Sports</option>
          <option value="news">News</option>
        </select>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTrends.map((trend) => (
          <div key={trend.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            {/* Trend Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{trend.name}</h3>
                <p className="text-button font-medium">{trend.hashtag}</p>
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium mt-1 capitalize">
                  {trend.category}
                </span>
              </div>
              
              {/* Alerts */}
              <div className="flex flex-col gap-1">
                {trend.alerts.volumeSpike && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Volume Spike
                  </div>
                )}
                {trend.alerts.engagementDrop && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Engagement Drop
                  </div>
                )}
                {trend.alerts.newPlatform && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    New Platform
                  </div>
                )}
              </div>
            </div>

            {/* Platforms */}
            <div className="flex flex-wrap gap-2 mb-4">
              {trend.platforms.map((platform) => (
                <span key={platform} className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(platform)}`}>
                  {platform}
                </span>
              ))}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-lg font-bold text-gray-900">{formatNumber(trend.metrics.totalPosts)}</div>
                <div className="text-xs text-gray-600">Total Posts</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{formatNumber(trend.metrics.totalViews)}</div>
                <div className="text-xs text-gray-600">Total Views</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{formatNumber(trend.metrics.totalEngagement)}</div>
                <div className="text-xs text-gray-600">Engagement</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">{trend.metrics.averageEngagement.toFixed(1)}%</div>
                <div className="text-xs text-gray-600">Avg Rate</div>
              </div>
            </div>

            {/* Current Status */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Volume:</span>
                <span className="font-medium">{trend.metrics.currentVolume} posts/day</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Peak Day:</span>
                <span className="font-medium">{new Date(trend.metrics.peakDay).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{new Date(trend.lastUpdated).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Trend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Track New Trend</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trend Name</label>
                <input
                  type="text"
                  placeholder="e.g., AI Revolution 2024"
                  value={newTrendData.name}
                  onChange={(e) => setNewTrendData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hashtag</label>
                <input
                  type="text"
                  placeholder="#hashtag"
                  value={newTrendData.hashtag}
                  onChange={(e) => setNewTrendData(prev => ({ ...prev, hashtag: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTrendData.category}
                  onChange={(e) => setNewTrendData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="technology">Technology</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="sports">Sports</option>
                  <option value="news">News</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platforms to Track</label>
                <div className="space-y-2">
                  {['youtube', 'tiktok', 'twitter', 'instagram'].map((platform) => (
                    <label key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTrendData.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTrendData(prev => ({
                              ...prev,
                              platforms: [...prev.platforms, platform]
                            }));
                          } else {
                            setNewTrendData(prev => ({
                              ...prev,
                              platforms: prev.platforms.filter(p => p !== platform)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTrend}
                className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90 transition-colors"
              >
                Start Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendTracking;