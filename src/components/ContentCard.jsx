import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { 
  FiPlay, 
  FiHeart, 
  FiShare2, 
  FiUser,
  FiEye,
  FiClock,
  FiZap,
  FiMusic,
  FiMaximize2,
  FiMinimize2,
  FiYoutube
} from 'react-icons/fi';

const ContentCard = ({ content, onShare }) => {
  const { t } = useTranslation();
  const [aiSummary, setAiSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  const fetchAISummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: content.title,
          description: content.description,
          platform: content.platform,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAiSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch AI summary:', error);
      setAiSummary(`${t('post.aiInsight')}: ${content.title}`);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (content.title && content.description) {
      fetchAISummary();
    }
  }, [content.title, content.description]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num?.toLocaleString() || '0';
  };

  const getEmbedUrl = (content) => {
    if (content.platform === 'youtube') {
      return `https://www.youtube.com/embed/${content.id}?autoplay=0&rel=0&modestbranding=1`;
    }
    // Add other platform embed URLs here
    return null;
  };

  const getPlatformStyles = (platform) => {
    const styles = {
      youtube: {
        badge: 'bg-red-600 text-white',
        icon: <FiYoutube size={12} />,
      },
      tiktok: {
        badge: 'bg-black text-white',
        icon: <FiMusic size={12} />,
      },
      twitter: {
        badge: 'bg-blue-400 text-white',
        icon: (
          <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-400 text-xs font-bold">𝕏</span>
          </div>
        ),
      },
      instagram: {
        badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        icon: <FiHeart size={12} />,
      }
    };
    return styles[platform] || styles.youtube;
  };

  const platformStyle = getPlatformStyles(content.platform);

  const handleShare = () => {
    const shareData = {
      title: content.title,
      text: aiSummary || content.description?.substring(0, 120) + '...',
      url: content.url,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(`${content.title}\n${content.url}`);
      if (onShare) onShare(shareData);
    }
  };

  const toggleEmbed = () => {
    setIsEmbedded(!isEmbedded);
  };

  const embedUrl = getEmbedUrl(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden group"
    >
      {/* Thumbnail or Embedded Video */}
      <div className="relative aspect-video">
        {isEmbedded && embedUrl ? (
          <div className="video-embed">
            <iframe
              src={embedUrl}
              title={content.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        
        {/* Platform Badge */}
        <div className={`absolute top-3 left-3 ${platformStyle.badge} px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg`}>
          {platformStyle.icon}
          <span className="capitalize">{content.platform}</span>
        </div>
        
        {/* Duration/Time */}
        {content.duration && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <FiClock size={10} />
            {content.duration}
          </div>
        )}

        {/* Trending Indicator */}
        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 animate-pulse shadow-lg shadow-blue-600/25">
          <FiZap size={10} />
          TRENDING
        </div>

        {/* Embed Toggle Button */}
        {embedUrl && (
          <button
            onClick={toggleEmbed}
            className="absolute bottom-3 left-3 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full hover:scale-110 transition-all duration-200 shadow-lg shadow-blue-600/25"
          >
            {isEmbedded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {content.title}
        </h3>

        {/* Creator & Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-1">
            <FiUser size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium">{content.channelTitle || content.creator}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <FiEye size={14} className="text-blue-600 dark:text-blue-400" />
              <span>{formatNumber(content.viewCount)}</span>
            </div>
            {content.likeCount && (
              <div className="flex items-center space-x-1">
                <FiHeart size={14} className="text-blue-600 dark:text-blue-400" />
                <span>{formatNumber(content.likeCount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Published Time */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {formatDistanceToNow(new Date(content.publishedAt), { addSuffix: true })}
        </div>

        {/* AI Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-700 dark:text-blue-300 text-sm font-medium flex items-center gap-1">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              {t('post.aiInsight')}
              {isLoadingSummary && (
                <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
              )}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
            {isLoadingSummary 
              ? t('post.loadMore')
              : aiSummary || t('post.aiInsight')
            }
          </p>
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {content.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs border border-blue-200 dark:border-blue-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          {!isEmbedded && (
            <button
              onClick={toggleEmbed}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FiPlay size={16} />
              {t('post.watchNow')}
            </button>
          )}
          <button
            onClick={handleShare}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center border border-gray-200 dark:border-gray-600"
          >
            <FiShare2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCard;