import React, { useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import {
  FaceSmileIcon,
  FaceFrownIcon,
  MinusIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';

interface SentimentData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface SentimentVisualizationProps {
  data: SentimentData[];
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void;
}

const SentimentVisualization: React.FC<SentimentVisualizationProps> = ({
  data,
  timeRange,
  onTimeRangeChange
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'trend' | 'distribution'>('overview');

  // Calculate current sentiment distribution
  const currentSentiment = data.reduce(
    (acc, curr) => ({
      positive: acc.positive + curr.positive,
      neutral: acc.neutral + curr.neutral,
      negative: acc.negative + curr.negative,
      total: acc.total + curr.total
    }),
    { positive: 0, neutral: 0, negative: 0, total: 0 }
  );

  const sentimentPercentages = {
    positive: currentSentiment.total > 0 ? (currentSentiment.positive / currentSentiment.total) * 100 : 0,
    neutral: currentSentiment.total > 0 ? (currentSentiment.neutral / currentSentiment.total) * 100 : 0,
    negative: currentSentiment.total > 0 ? (currentSentiment.negative / currentSentiment.total) * 100 : 0
  };

  // Prepare data for charts
  const radialData = [
    {
      name: 'Positive',
      value: sentimentPercentages.positive,
      fill: '#10b981'
    },
    {
      name: 'Neutral',
      value: sentimentPercentages.neutral,
      fill: '#6b7280'
    },
    {
      name: 'Negative',
      value: sentimentPercentages.negative,
      fill: '#ef4444'
    }
  ];

  const pieData = [
    { name: 'Positive', value: currentSentiment.positive, color: '#10b981' },
    { name: 'Neutral', value: currentSentiment.neutral, color: '#6b7280' },
    { name: 'Negative', value: currentSentiment.negative, color: '#ef4444' }
  ];

  const trendData = data.map(item => ({
    ...item,
    positivePercent: item.total > 0 ? (item.positive / item.total) * 100 : 0,
    neutralPercent: item.total > 0 ? (item.neutral / item.total) * 100 : 0,
    negativePercent: item.total > 0 ? (item.negative / item.total) * 100 : 0
  }));

  const getSentimentTrend = () => {
    if (data.length < 2) return { trend: 'neutral', change: 0 };
    
    const recent = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const recentPositive = recent.total > 0 ? (recent.positive / recent.total) * 100 : 0;
    const previousPositive = previous.total > 0 ? (previous.positive / previous.total) * 100 : 0;
    
    const change = recentPositive - previousPositive;
    
    return {
      trend: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
      change: Math.abs(change)
    };
  };

  const sentimentTrend = getSentimentTrend();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-[#2a4152]/10">
          <p className="font-medium text-[#2a4152] font-['Figtree'] mb-2">
            {new Date(label).toLocaleDateString()}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-['Figtree']" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const viewOptions = [
    { key: 'overview', label: 'Overview' },
    { key: 'trend', label: 'Trend' },
    { key: 'distribution', label: 'Distribution' }
  ];

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#2a4152]/10 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#2a4152] font-['Figtree']">
          Sentiment Analysis
        </h3>
        
        <div className="flex space-x-2">
          {viewOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveView(option.key as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium font-['Figtree'] transition-all ${
                activeView === option.key
                    ? 'bg-black text-white'
  : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2 mb-6">
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeRangeChange(option.value as any)}
            className={`px-3 py-1 rounded-lg text-sm font-medium font-['Figtree'] transition-all ${
              timeRange === option.value
                ? 'bg-[#2a4152]/10 text-[#2a4152] border border-[#2a4152]/20'
                : 'text-[#2a4152]/60 hover:text-[#2a4152] hover:bg-[#2a4152]/5'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary Cards */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-green-50 rounded-lg p-4 border border-green-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <FaceSmileIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 font-['Figtree']">
                    Positive
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-900 font-['Figtree']">
                  {sentimentPercentages.positive.toFixed(1)}%
                </div>
                <div className="text-xs text-green-600 font-['Figtree']">
                  {currentSentiment.positive.toLocaleString()} mentions
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <MinusIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800 font-['Figtree']">
                    Neutral
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 font-['Figtree']">
                  {sentimentPercentages.neutral.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 font-['Figtree']">
                  {currentSentiment.neutral.toLocaleString()} mentions
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-red-50 rounded-lg p-4 border border-red-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <FaceFrownIcon className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800 font-['Figtree']">
                    Negative
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-900 font-['Figtree']">
                  {sentimentPercentages.negative.toFixed(1)}%
                </div>
                <div className="text-xs text-red-600 font-['Figtree']">
                  {currentSentiment.negative.toLocaleString()} mentions
                </div>
              </motion.div>
            </div>
            
            {/* Trend Indicator */}
            <div className="bg-[#eee9dd]/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#2a4152] font-['Figtree']">
                  Sentiment Trend
                </span>
                <div className={`flex items-center space-x-1 ${
                  sentimentTrend.trend === 'positive' ? 'text-green-600' :
                  sentimentTrend.trend === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {sentimentTrend.trend === 'positive' && <TrendingUpIcon className="w-4 h-4" />}
                  {sentimentTrend.trend === 'negative' && <TrendingDownIcon className="w-4 h-4" />}
                  <span className="text-sm font-medium font-['Figtree']">
                    {sentimentTrend.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Radial Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="80%" data={radialData}>
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  fill={(entry: any) => entry.fill}
                />
                <Legend
                  iconSize={12}
                  wrapperStyle={{ fontFamily: 'Figtree', fontSize: '14px' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeView === 'trend' && (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a4152" strokeOpacity={0.1} />
              <XAxis 
                dataKey="date" 
                stroke="#2a4152"
                fontSize={12}
                fontFamily="Figtree"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#2a4152"
                fontSize={12}
                fontFamily="Figtree"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontFamily: 'Figtree', fontSize: '14px' }} />
              <Area
                type="monotone"
                dataKey="positivePercent"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Positive"
              />
              <Area
                type="monotone"
                dataKey="neutralPercent"
                stackId="1"
                stroke="#6b7280"
                fill="#6b7280"
                fillOpacity={0.6}
                name="Neutral"
              />
              <Area
                type="monotone"
                dataKey="negativePercent"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Negative"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeView === 'distribution' && (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [value.toLocaleString(), name]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #2a4152',
                  borderRadius: '8px',
                  fontFamily: 'Figtree'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default SentimentVisualization;