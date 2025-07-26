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
  FiYoutube,
  FiTrendingUp,
  FiMessageCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ContentCard = ({ content, onShare, index = 0 }) => {
  const { t } = useTranslation();
  const [aiSummary, setAiSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

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
        badge: 'bg-gradient-to-r from-red-600 to-red-700 text-white',
        icon: <FiYoutube size={12} />,
      },
      tiktok: {
        badge: 'bg-gradient-to-r from-black to-gray-800 text-white',
        icon: <FiMusic size={12} />,
      },
      twitter: {
        badge: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
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
      toast.success('Link copied to clipboard!');
      if (onShare) onShare(shareData);
    }
  };

  const toggleEmbed = () => {
    setIsEmbedded(!isEmbedded);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const embedUrl = getEmbedUrl(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden group card-hover"
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
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        )}
        
        {/* Platform Badge */}
        <div className={`absolute top-3 left-3 ${platformStyle.badge} px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-sm`}>
          {platformStyle.icon}
          <span className="capitalize font-semibold">{content.platform}</span>
        </div>
        
        {/* Duration/Time */}
        {content.duration && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 backdrop-blur-sm">
            <FiClock size={10} />
            {content.duration}
          </div>
        )}

        {/* Trending Indicator */}
        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 animate-pulse shadow-lg shadow-blue-600/25 backdrop-blur-sm">
          <FiTrendingUp size={10} />
          TRENDING
        </div>

        {/* Embed Toggle Button */}
        {embedUrl && (
          <button
            onClick={toggleEmbed}
            className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2.5 rounded-full hover:scale-110 transition-all duration-200 shadow-lg shadow-blue-600/25 backdrop-blur-sm"
          >
            {isEmbedded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="font-bold text-xl text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors duration-300">
          {content.title}
        </h3>

        {/* Creator & Stats */}
        <div className="flex items-center justify-between text-sm text-gray-300 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FiUser size={14} className="text-white" />
            </div>
            <span className="font-medium text-white">{content.channelTitle || content.creator}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FiEye size={14} className="text-blue-400" />
              <span className="text-gray-300">{formatNumber(content.viewCount)}</span>
            </div>
            {content.likeCount && (
              <div className="flex items-center space-x-1">
                <FiHeart size={14} className="text-red-400" />
                <span className="text-gray-300">{formatNumber(content.likeCount)}</span>
              </div>
            )}
            {content.commentCount && (
              <div className="flex items-center space-x-1">
                <FiMessageCircle size={14} className="text-green-400" />
                <span className="text-gray-300">{formatNumber(content.commentCount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Published Time */}
        <div className="text-xs text-gray-400 mb-4 flex items-center gap-1">
          <FiClock size={12} />
          {formatDistanceToNow(new Date(content.publishedAt), { addSuffix: true })}
        </div>

        {/* AI Summary */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-300 text-sm font-medium flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              {t('post.aiInsight')}
              {isLoadingSummary && (
                <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
              )}
            </span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">
            {isLoadingSummary 
              ? t('post.loadMore')
              : aiSummary || t('post.aiInsight')
            }
          </p>
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-gradient-to-r from-gray-700 to-gray-800 text-blue-300 px-3 py-1.5 rounded-lg text-xs border border-gray-600 hover:border-blue-500 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          {!isEmbedded && (
            <button
              onClick={toggleEmbed}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-center py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
            >
              <FiPlay size={16} />
              {t('post.watchNow')}
            </button>
          )}
          <button
            onClick={handleLike}
            className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center border ${
              isLiked 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500' 
                : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 border-gray-600 hover:border-red-500'
            }`}
          >
            <FiHeart size={16} className={isLiked ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center border border-gray-600 hover:border-blue-500"
          >
            <FiShare2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCard;