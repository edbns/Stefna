import React from 'react';
import { motion } from 'framer-motion';
import FollowButton from './FollowButton';

interface HashtagCardProps {
  hashtag: string;
  count?: number;
  trend?: 'up' | 'down' | 'stable';
  onAuthRequired?: () => void;
  onClick?: () => void;
}

const HashtagCard: React.FC<HashtagCardProps> = ({
  hashtag,
  count,
  trend,
  onAuthRequired,
  onClick
}) => {
  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '➡️'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer"
      style={{ fontFamily: 'Figtree, sans-serif' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg" style={{ color: '#2a4152' }}>
            #{hashtag}
          </h3>
          {count && (
            <p className="text-sm text-gray-600 mt-1">
              {count.toLocaleString()} posts
            </p>
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center space-x-1 ${trendColors[trend]}`}>
            <span className="text-lg">{trendIcons[trend]}</span>
            <span className="text-sm font-medium">
              {trend === 'up' ? '+12%' : trend === 'down' ? '-8%' : '0%'}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-white"
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">+{Math.floor(Math.random() * 50)} others</span>
        </div>
        
        <FollowButton
          type="hashtag"
          item={hashtag}
          onAuthRequired={onAuthRequired}
          size="sm"
          variant="primary"
        />
      </div>
    </motion.div>
  );
};

export default HashtagCard;