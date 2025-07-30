import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

interface EngagementData {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

interface EngagementChartProps {
  data: EngagementData[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
}

const EngagementChart: React.FC<EngagementChartProps> = ({
  data,
  timeRange,
  onTimeRangeChange
}) => {
  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-[#2a4152]/10">
          <p className="font-medium text-[#2a4152] font-['Figtree'] mb-2">
            {new Date(label).toLocaleDateString()}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-['Figtree']" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
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
          Engagement Metrics
        </h3>
        
        <div className="flex space-x-2">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTimeRangeChange(option.value as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium font-['Figtree'] transition-all ${
                timeRange === option.value
                    ? 'bg-black text-white'
  : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontFamily: 'Figtree', fontSize: '14px' }}
            />
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="Views"
            />
            <Line 
              type="monotone" 
              dataKey="likes" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              name="Likes"
            />
            <Line 
              type="monotone" 
              dataKey="comments" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              name="Comments"
            />
            <Line 
              type="monotone" 
              dataKey="shares" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              name="Shares"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default EngagementChart;