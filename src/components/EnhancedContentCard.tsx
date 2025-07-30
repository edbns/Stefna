import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EyeIcon,
  TrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ContentData {
  id: string;
  title: string;
  platform: string;
  author: string;
  thumbnail: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  timestamp: string;
  trending: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface EnhancedContentCardProps {
  content: ContentData;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onView?: (id: string) => void;
  realTimeUpdates?: boolean;
}

const EnhancedContentCard: React.FC<EnhancedContentCardProps> = ({
  content,
  onLike,
  onShare,
  onView,
  realTimeUpdates = false
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [metrics, setMetrics] = useState(content.metrics);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate real-time metric updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      const shouldUpdate = Math.random() > 0.7; // 30% chance of update
      if (shouldUpdate) {
        setMetrics(prev => ({
          ...prev,
          likes: prev.likes + Math.floor(Math.random() * 5),
          comments: prev.comments + Math.floor(Math.random() * 3),
          views: prev.views + Math.floor(Math.random() * 50)
        }));
        setLastUpdate(new Date());
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-[#2a4152]/60';
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setMetrics(prev => ({
      ...prev,
      likes: isLiked ? prev.likes - 1 : prev.likes + 1
    }));
    onLike?.(content.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-[#2a4152]/10 overflow-hidden hover:shadow-md transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#2a4152]/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-[#2a4152] font-['Figtree']">
              {content.platform}
            </span>
            {content.trending && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center space-x-1 text-orange-500"
              >
                <TrendingUpIcon className="w-4 h-4" />
                <span className="text-xs font-medium">Trending</span>
              </motion.div>
            )}
          </div>
          <div className="flex items-center space-x-1 text-[#2a4152]/60">
            <ClockIcon className="w-4 h-4" />
            <span className="text-xs font-['Figtree']">{content.timestamp}</span>
          </div>
        </div>
        
        <h3 className="font-semibold text-[#2a4152] font-['Figtree'] line-clamp-2 mb-1">
          {content.title}
        </h3>
        
        <p className="text-sm text-[#2a4152]/70 font-['Figtree']">
          by {content.author}
        </p>
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#2a4152]/5">
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDQgNzJIMTc2VjEwOEgxNDRWNzJaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
          }}
        />
        
        {/* Sentiment Indicator */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-white/90 ${getSentimentColor(content.sentiment)}`}>
          {content.sentiment}
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className="flex items-center space-x-1 text-[#2a4152]/70 hover:text-red-500 transition-colors"
            >
              {isLiked ? (
                <HeartSolidIcon className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              <span className="text-sm font-medium font-['Figtree']">
                {formatNumber(metrics.likes)}
              </span>
            </motion.button>
            
            <div className="flex items-center space-x-1 text-[#2a4152]/70">
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium font-['Figtree']">
                {formatNumber(metrics.comments)}
              </span>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onShare?.(content.id)}
              className="flex items-center space-x-1 text-[#2a4152]/70 hover:text-blue-500 transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
              <span className="text-sm font-medium font-['Figtree']">
                {formatNumber(metrics.shares)}
              </span>
            </motion.button>
          </div>
          
          <div className="flex items-center space-x-1 text-[#2a4152]/60">
            <EyeIcon className="w-4 h-4" />
            <span className="text-sm font-medium font-['Figtree']">
              {formatNumber(metrics.views)}
            </span>
          </div>
        </div>
        
        {realTimeUpdates && (
          <div className="mt-2 text-xs text-[#2a4152]/50 font-['Figtree']">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedContentCard;