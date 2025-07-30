import React, { useState, useEffect } from 'react';
import { TrendingUp, Hash, BarChart3, Globe, Filter, ChevronDown, MapPin, Heart, MessageCircle, Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface TrendingCategory {
  id: string;
  name: string;
  postVolume: number;
  engagement: number;
  growth: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface TrendingHashtag {
  id: string;
  tag: string;
  postCount: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  growth: string;
}

interface GlobalTrend {
  country: string;
  flag: string;
  trendingTopics: string[];
  engagement: number;
}

const Trending: React.FC<TrendingProps> = ({ onAuthOpen, selectedPlatform = 'all' }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [trendingData, setTrendingData] = useState<TrendingData>({ categories: [], hashtags: [], globalTrends: [] });
  const [sentimentData, setSentimentData] = useState<SentimentData>({ positive: 0, neutral: 0, negative: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Remove mock data declarations

  useEffect(() => {
    const fetchTrendingData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Comment out service calls until implemented
        // const [trending, sentiment] = await Promise.all([
        //   trendingService.getTrendingData(selectedPlatform),
        //   sentimentService.getSentimentData(selectedPlatform)
        // ]);
        
        setTrendingData({ categories: [], hashtags: [], globalTrends: [] });
        setSentimentData({ positive: 0, neutral: 0, negative: 0 });
      } catch (err) {
        console.error('Error fetching trending data:', err);
        setError('Failed to load trending data');
        setTrendingData({ categories: [], hashtags: [], globalTrends: [] });
        setSentimentData({ positive: 0, neutral: 0, negative: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, [selectedPlatform, user]);
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Mock data for trending categories
  // Remove these mock data arrays:
  const trendingCategories: TrendingCategory[] = [
    { id: '1', name: 'Technology', postVolume: 45200, engagement: 8.7, growth: '+23%', sentiment: 'positive' },
    { id: '2', name: 'Politics', postVolume: 38900, engagement: 12.3, growth: '+45%', sentiment: 'negative' },
    { id: '3', name: 'Entertainment', postVolume: 52100, engagement: 15.2, growth: '+18%', sentiment: 'positive' },
    { id: '4', name: 'Sports', postVolume: 29800, engagement: 11.8, growth: '+12%', sentiment: 'positive' },
    { id: '5', name: 'Music', postVolume: 34500, engagement: 14.5, growth: '+28%', sentiment: 'positive' },
    { id: '6', name: 'Gaming', postVolume: 27300, engagement: 16.8, growth: '+35%', sentiment: 'positive' }
  ];

  // Mock data for trending hashtags
  const trendingHashtags: TrendingHashtag[] = [
    { id: '1', tag: '#AI2024', postCount: 125000, sentiment: 'positive', growth: '+156%' },
    { id: '2', tag: '#ClimateAction', postCount: 89000, sentiment: 'neutral', growth: '+89%' },
    { id: '3', tag: '#TechNews', postCount: 76000, sentiment: 'positive', growth: '+67%' },
    { id: '4', tag: '#Election2024', postCount: 145000, sentiment: 'negative', growth: '+234%' },
    { id: '5', tag: '#Viral', postCount: 98000, sentiment: 'positive', growth: '+123%' },
    { id: '6', tag: '#Breaking', postCount: 67000, sentiment: 'neutral', growth: '+45%' }
  ];

  // Mock data for global trends
  const globalTrends: GlobalTrend[] = [
    { country: 'United States', flag: '🇺🇸', trendingTopics: ['AI Revolution', 'Election Updates', 'Tech Stocks'], engagement: 89.2 },
    { country: 'United Kingdom', flag: '🇬🇧', trendingTopics: ['Royal News', 'Brexit Impact', 'Climate Summit'], engagement: 76.8 },
    { country: 'Japan', flag: '🇯🇵', trendingTopics: ['Anime Trends', 'Tech Innovation', 'Cultural Events'], engagement: 82.5 },
    { country: 'Germany', flag: '🇩🇪', trendingTopics: ['Green Energy', 'EU Politics', 'Oktoberfest'], engagement: 71.3 },
    { country: 'Brazil', flag: '🇧🇷', trendingTopics: ['Football News', 'Carnival Prep', 'Amazon Updates'], engagement: 85.7 }
  ];

  // Sentiment analysis data
  const sentimentData = {
    positive: 58.3,
    neutral: 28.7,
    negative: 13.0
  };

  const tabs = [
    { id: 'categories', label: 'Trending Categories', icon: BarChart3 },
    { id: 'hashtags', label: 'Trending Hashtags', icon: Hash },
    { id: 'sentiment', label: 'Sentiment Analysis', icon: Heart },
    { id: 'global', label: 'Global Reach', icon: Globe }
  ];

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

  const renderCategories = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trendingCategories.map((category) => (
        <div key={category.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(category.sentiment)}`}>
              {category.sentiment}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Post Volume</span>
              <span className="font-semibold">{formatNumber(category.postVolume)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Engagement Rate</span>
              <span className="font-semibold">{category.engagement}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Growth</span>
              <span className="font-semibold text-green-600">{category.growth}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHashtags = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {trendingHashtags.map((hashtag) => (
        <div key={hashtag.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">{hashtag.tag}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(hashtag.sentiment)}`}>
              {hashtag.sentiment}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Post Count</span>
              <span className="font-semibold">{formatNumber(hashtag.postCount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Growth</span>
              <span className="font-semibold text-green-600">{hashtag.growth}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSentiment = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Pie Chart Representation */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Overall Sentiment Distribution</h3>
        <div className="relative w-64 h-64 mx-auto">
          {/* Simple pie chart using CSS */}
          <div className="w-full h-full rounded-full relative overflow-hidden" style={{
            background: `conic-gradient(
              #10b981 0deg ${sentimentData.positive * 3.6}deg,
              #6b7280 ${sentimentData.positive * 3.6}deg ${(sentimentData.positive + sentimentData.neutral) * 3.6}deg,
              #ef4444 ${(sentimentData.positive + sentimentData.neutral) * 3.6}deg 360deg
            )`
          }}>
            <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">Sentiment</div>
                <div className="text-sm text-gray-600">Analysis</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Positive</span>
            </div>
            <span className="font-semibold">{sentimentData.positive}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Neutral</span>
            </div>
            <span className="font-semibold">{sentimentData.neutral}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Negative</span>
            </div>
            <span className="font-semibold">{sentimentData.negative}%</span>
          </div>
        </div>
      </div>

      {/* Sentiment Heatmap */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Sentiment Heatmap by Platform</h3>
        <div className="space-y-4">
          {['YouTube', 'TikTok', 'Twitter/X', 'Instagram'].map((platform, index) => {
            const positivePercent = [65, 72, 45, 68][index];
            const neutralPercent = [25, 20, 35, 22][index];
            const negativePercent = [10, 8, 20, 10][index];
            
            return (
              <div key={platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{platform}</span>
                  <span className="text-sm text-gray-600">{positivePercent + neutralPercent + negativePercent}% analyzed</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                  <div className="bg-green-500" style={{ width: `${positivePercent}%` }}></div>
                  <div className="bg-gray-400" style={{ width: `${neutralPercent}%` }}></div>
                  <div className="bg-red-500" style={{ width: `${negativePercent}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Positive: {positivePercent}%</span>
                  <span>Neutral: {neutralPercent}%</span>
                  <span>Negative: {negativePercent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderGlobal = () => (
    <div className="space-y-8">
      {/* Interactive Map Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Global Trending Distribution</h3>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <Globe className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Interactive World Map</p>
          <p className="text-sm text-gray-500">Click on countries to see regional trending topics</p>
        </div>
      </div>

      {/* Country-wise Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {globalTrends.map((trend, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{trend.flag}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{trend.country}</h3>
                <p className="text-sm text-gray-600">Engagement: {trend.engagement}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Top Trending Topics:</p>
              {trend.trendingTopics.map((topic, topicIndex) => (
                <div key={topicIndex} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'categories': return renderCategories();
      case 'hashtags': return renderHashtags();
      case 'sentiment': return renderSentiment();
      case 'global': return renderGlobal();
      default: return renderCategories();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-button" />
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            Advanced Trending Analytics
          </h1>
        </div>
        
        {/* Timeframe Filter */}
        <div className="relative">
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-button focus:border-transparent"
          >
            {timeframes.map((timeframe) => (
              <option key={timeframe.id} value={timeframe.id}>{timeframe.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-button text-button'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Trending;