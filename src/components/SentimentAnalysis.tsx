import React, { useState } from 'react';
import { 
  Heart, 
  ChevronDown,
  TrendingUp,
  Activity,
  Target,
  Sparkles,
  ArrowUpRight,
  Clock,
  Filter,
  MessageSquare,
  Share2,
  Star,
  CheckCircle,
  Calendar,
  AlertCircle,
  Zap,
  Brain,
  FileText,
  Video,
  BarChart3,
  PieChart,
  TrendingDown,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SentimentData {
  id: string;
  platform: string;
  positive: number;
  neutral: number;
  negative: number;
  totalPosts: number;
  color: string;
  growth: string;
  topTopics: string[];
  engagement: number;
}

const SentimentAnalysis: React.FC = () => {
  const { t } = useLanguage();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const sentimentData: SentimentData[] = [
    { 
      id: '1', 
      platform: 'Twitter', 
      positive: 65, 
      neutral: 25, 
      negative: 10, 
      totalPosts: 45000,
      color: '#1DA1F2',
      growth: '+12%',
      topTopics: ['Technology', 'Politics', 'Entertainment'],
      engagement: 8.5
    },
    { 
      id: '2', 
      platform: 'Instagram', 
      positive: 78, 
      neutral: 18, 
      negative: 4, 
      totalPosts: 32000,
      color: '#E4405F',
      growth: '+18%',
      topTopics: ['Fashion', 'Lifestyle', 'Travel'],
      engagement: 12.3
    },
    { 
      id: '3', 
      platform: 'TikTok', 
      positive: 72, 
      neutral: 22, 
      negative: 6, 
      totalPosts: 28000,
      color: '#000000',
      growth: '+25%',
      topTopics: ['Dance', 'Comedy', 'Education'],
      engagement: 15.7
    },
    { 
      id: '4', 
      platform: 'YouTube', 
      positive: 68, 
      neutral: 24, 
      negative: 8, 
      totalPosts: 15000,
      color: '#FF0000',
      growth: '+8%',
      topTopics: ['Gaming', 'Reviews', 'Tutorials'],
      engagement: 9.2
    },
    { 
      id: '5', 
      platform: 'Reddit', 
      positive: 45, 
      neutral: 35, 
      negative: 20, 
      totalPosts: 18000,
      color: '#FF4500',
      growth: '+15%',
      topTopics: ['Discussion', 'News', 'Memes'],
      engagement: 6.8
    },
    { 
      id: '6', 
      platform: 'LinkedIn', 
      positive: 85, 
      neutral: 12, 
      negative: 3, 
      totalPosts: 8500,
      color: '#0077B5',
      growth: '+22%',
      topTopics: ['Business', 'Career', 'Networking'],
      engagement: 11.4
    }
  ];

  const timeframes = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const filters = [
    { value: 'all', label: 'All Platforms' },
    { value: 'positive', label: 'High Positive' },
    { value: 'negative', label: 'High Negative' },
    { value: 'engagement', label: 'High Engagement' }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSentimentIcon = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive': return Smile;
      case 'neutral': return Meh;
      case 'negative': return Frown;
    }
  };

  const filteredData = sentimentData.filter(data => {
    if (selectedFilter === 'positive') return data.positive > 70;
    if (selectedFilter === 'negative') return data.negative > 15;
    if (selectedFilter === 'engagement') return data.engagement > 10;
    return true;
  });

  const overallStats = {
    totalPosts: sentimentData.reduce((sum, data) => sum + data.totalPosts, 0),
    avgPositive: sentimentData.reduce((sum, data) => sum + data.positive, 0) / sentimentData.length,
    avgEngagement: sentimentData.reduce((sum, data) => sum + data.engagement, 0) / sentimentData.length,
    topGrowth: Math.max(...sentimentData.map(data => parseInt(data.growth.replace('+', '').replace('%', ''))))
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Sentiment Analysis</h1>
          <p className="text-gray-600">Analyze sentiment across social media platforms</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Brain className="w-4 h-4" />
            <span>AI Powered</span>
          </div>
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
            <MessageSquare className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Total Posts</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.totalPosts)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Smile className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Avg Positive</p>
              <p className="text-2xl font-bold">{overallStats.avgPositive.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Avg Engagement</p>
              <p className="text-2xl font-bold">{overallStats.avgEngagement.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-90">Top Growth</p>
              <p className="text-2xl font-bold">+{overallStats.topGrowth}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((data) => {
          const PositiveIcon = getSentimentIcon('positive');
          const NeutralIcon = getSentimentIcon('neutral');
          const NegativeIcon = getSentimentIcon('negative');
          
          return (
            <div key={data.id} className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${data.color}20`, color: data.color }}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">{data.platform}</h3>
                    <p className="text-sm text-gray-500">{formatNumber(data.totalPosts)} posts</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </div>

              {/* Sentiment Bars */}
              <div className="space-y-4 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PositiveIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Positive</span>
                    </div>
                    <span className="font-semibold text-black">{data.positive}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{width: `${data.positive}%`}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <NeutralIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Neutral</span>
                    </div>
                    <span className="font-semibold text-black">{data.neutral}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full transition-all duration-300" style={{width: `${data.neutral}%`}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <NegativeIcon className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Negative</span>
                    </div>
                    <span className="font-semibold text-black">{data.negative}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{width: `${data.negative}%`}}></div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Growth</p>
                    <p className="text-sm font-medium text-green-600">{data.growth}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Engagement</p>
                    <p className="text-sm font-medium text-black">{data.engagement}%</p>
                  </div>
                </div>
              </div>

              {/* Top Topics */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Top Topics:</p>
                <div className="flex flex-wrap gap-1">
                  {data.topTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Sentiment Chart Placeholder */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Overall Sentiment Trends</h3>
        <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Interactive sentiment chart will be added here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;