import React from 'react';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface SummaryMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  format?: 'number' | 'percentage' | 'currency';
}

interface AnalyticsSummaryProps {
  metrics: SummaryMetric[];
  period: string;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ metrics, period }) => {
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toLocaleString();
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUpIcon className="w-4 h-4" />;
      case 'decrease':
        return <TrendingDownIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-500 bg-green-50';
      case 'decrease':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-[#2a4152]/60 bg-[#2a4152]/5';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl shadow-sm border border-[#2a4152]/10 p-6 hover:shadow-md transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${metric.color}15` }}
              >
                <Icon 
                  className="w-6 h-6" 
                  style={{ color: metric.color }}
                />
              </div>
              
              {metric.change !== 0 && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeColor(metric.changeType)}`}>
                  {getChangeIcon(metric.changeType)}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <h3 className="text-2xl font-bold text-[#2a4152] font-['Figtree'] mb-1">
                {formatValue(metric.value, metric.format)}
              </h3>
              <p className="text-sm text-[#2a4152]/70 font-['Figtree'] mb-2">
                {metric.title}
              </p>
              <p className="text-xs text-[#2a4152]/50 font-['Figtree']">
                vs {period}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Example usage data
export const defaultMetrics: SummaryMetric[] = [
  {
    id: 'total-views',
    title: 'Total Views',
    value: 2847392,
    change: 12.5,
    changeType: 'increase',
    icon: EyeIcon,
    color: '#3b82f6'
  },
  {
    id: 'engagement-rate',
    title: 'Engagement Rate',
    value: 4.2,
    change: -0.8,
    changeType: 'decrease',
    icon: HeartIcon,
    color: '#ef4444',
    format: 'percentage'
  },
  {
    id: 'total-followers',
    title: 'Total Followers',
    value: 156789,
    change: 8.3,
    changeType: 'increase',
    icon: UserGroupIcon,
    color: '#10b981'
  },
  {
    id: 'reach',
    title: 'Reach',
    value: 892456,
    change: 15.7,
    changeType: 'increase',
    icon: GlobeAltIcon,
    color: '#f59e0b'
  }
];

export default AnalyticsSummary;