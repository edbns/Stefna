import React, { useState } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SentimentData {
  id: string;
  platform: string;
  positive: number;
  neutral: number;
  negative: number;
  totalPosts: number;
}

const SentimentAnalysis: React.FC = () => {
  const { t } = useLanguage();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  const sentimentData: SentimentData[] = [
    { id: '1', platform: 'Twitter', positive: 65, neutral: 25, negative: 10, totalPosts: 45000 },
    { id: '2', platform: 'Instagram', positive: 78, neutral: 18, negative: 4, totalPosts: 32000 },
    { id: '3', platform: 'TikTok', positive: 72, neutral: 22, negative: 6, totalPosts: 28000 },
    { id: '4', platform: 'YouTube', positive: 68, neutral: 24, negative: 8, totalPosts: 15000 }
  ];

  const timeframes = [
    { id: '1h', label: 'Last Hour' },
    { id: '24h', label: 'Last 24 Hours' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-button" />
          <h1 className="text-3xl font-bold text-button font-['Figtree']">
            Sentiment Analysis
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

      {/* Sentiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sentimentData.map((data) => (
          <div key={data.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{data.platform}</h3>
              <span className="text-sm text-gray-600">{formatNumber(data.totalPosts)} posts</span>
            </div>
            
            {/* Sentiment Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Positive</span>
                <span className="font-semibold">{data.positive}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: `${data.positive}%`}}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Neutral</span>
                <span className="font-semibold">{data.neutral}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full" style={{width: `${data.neutral}%`}}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Negative</span>
                <span className="font-semibold">{data.negative}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{width: `${data.negative}%`}}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentAnalysis;