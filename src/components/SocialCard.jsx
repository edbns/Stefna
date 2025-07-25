import React from 'react';
import { useTranslation } from 'react-i18next';

const SocialCard = ({ post }) => {
  const { t } = useTranslation();

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toLocaleString();
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getPlatformBadge = (platform) => {
    const badges = {
      youtube: {
        bg: 'bg-red-500',
        icon: '▶️',
        text: 'YouTube'
      },
      tiktok: {
        bg: 'bg-black',
        icon: '🎵',
        text: 'TikTok'
      }
    };
    return badges[platform] || { bg: 'bg-gray-500', icon: '📱', text: 'Social' };
  };

  const badge = getPlatformBadge(post.platform);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Thumbnail */}
      <div className="relative">
        <img
          src={post.thumbnail}
          alt={post.title}
          className="w-full h-48 sm:h-56 object-cover"
          loading="lazy"
        />
        
        {/* Platform Badge */}
        <div className={`absolute top-3 left-3 ${badge.bg} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
          <span>{badge.icon}</span>
          <span>{badge.text}</span>
        </div>
        
        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {post.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Creator & Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span className="font-medium">{post.creator}</span>
          <div className="flex items-center gap-3">
            <span>{formatViews(post.views)} {t('post.views')}</span>
            <span>{formatTimeAgo(post.publishedAt)}</span>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              🤖 {t('post.aiInsight')}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {post.aiSummary}
          </p>
        </div>

        {/* Watch Button */}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-center py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
        >
          {t('post.watchNow')} →
        </a>
      </div>
    </div>
  );
};

export default SocialCard;