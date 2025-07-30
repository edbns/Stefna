import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface PlatformData {
  platform: string;
  engagement: number;
  reach: number;
  growth: number;
  color: string;
}

interface PlatformPerformanceProps {
  data: PlatformData[];
}

const PlatformPerformance: React.FC<PlatformPerformanceProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'engagement' | 'reach' | 'growth'>('engagement');

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <TrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <MinusIcon className="w-4 h-4 text-[#2a4152]/60" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-green-500';
    if (growth < 0) return 'text-red-500';
    return 'text-[#2a4152]/60';
  };

  const viewOptions = [
    { key: 'engagement', label: 'Engagement', dataKey: 'engagement' },
    { key: 'reach', label: 'Reach', dataKey: 'reach' },
    { key: 'growth', label: 'Growth', dataKey: 'growth' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-[#2a4152]/10">
          <p className="font-medium text-[#2a4152] font-['Figtree'] mb-1">
            {label}
          </p>
          <p className="text-sm font-['Figtree']" style={{ color: payload[0].color }}>
            {activeView}: {payload[0].value.toLocaleString()}
            {activeView === 'growth' && '%'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#2a4152]/10 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#2a4152] font-['Figtree']">
          Platform Performance
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a4152" strokeOpacity={0.1} />
              <XAxis 
                dataKey="platform" 
                stroke="#2a4152"
                fontSize={12}
                fontFamily="Figtree"
              />
              <YAxis 
                stroke="#2a4152"
                fontSize={12}
                fontFamily="Figtree"
                tickFormatter={(value) => {
                  if (activeView === 'growth') return `${value}%`;
                  return value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={viewOptions.find(v => v.key === activeView)?.dataKey}
                fill={(entry: any) => entry.color}
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Stats */}
        <div className="space-y-4">
          {data.map((platform, index) => (
            <motion.div
              key={platform.platform}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-[#eee9dd]/30 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="font-medium text-[#2a4152] font-['Figtree']">
                  {platform.platform}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-[#2a4152] font-['Figtree']">
                    {platform[activeView as keyof PlatformData].toLocaleString()}
                    {activeView === 'growth' && '%'}
                  </p>
                  <p className="text-xs text-[#2a4152]/60 font-['Figtree']">
                    {activeView}
                  </p>
                </div>
                
                {activeView !== 'growth' && (
                  <div className={`flex items-center space-x-1 ${getTrendColor(platform.growth)}`}>
                    {getTrendIcon(platform.growth)}
                    <span className="text-sm font-medium font-['Figtree']">
                      {Math.abs(platform.growth)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PlatformPerformance;