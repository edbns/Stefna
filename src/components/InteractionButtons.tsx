import React, { useState, useEffect } from 'react';
import { Heart, UserPlus, HeartOff, UserMinus, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserInteractionService, { InteractionStats } from '../services/UserInteractionService';
import toast from 'react-hot-toast';

interface InteractionButtonsProps {
  contentType: 'music' | 'youtube' | 'reddit' | 'news' | 'crypto' | 'creator';
  contentId: string;
  metadata?: any;
  onAuthOpen?: () => void;
  className?: string;
}

const InteractionButtons: React.FC<InteractionButtonsProps> = ({
  contentType,
  contentId,
  metadata,
  onAuthOpen,
  className = ''
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<InteractionStats>({
    likes: 0,
    follows: 0,
    isLiked: false,
    isFollowed: false
  });
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    updateStats();
  }, [contentType, contentId]);

  const updateStats = () => {
    const currentStats = UserInteractionService.getStats(contentType, contentId);
    setStats(currentStats);
  };

  const handleLike = async () => {
    if (!user) {
      // Open auth modal instead of just showing toast
      onAuthOpen?.();
      return;
    }

    setLoading(true);
    try {
      const isLiked = UserInteractionService.like(contentType, contentId, metadata);
      updateStats();
      
      if (isLiked) {
        toast.success('❤️ Added to your favorites!', {
          icon: '❤️',
          style: {
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
            border: '1px solid #fbcfe8',
            color: '#be185d'
          }
        });
      } else {
        toast.success('Removed from favorites', {
          style: {
            background: '#f3f4f6',
            color: '#6b7280'
          }
        });
      }
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      // Open auth modal instead of just showing toast
      onAuthOpen?.();
      return;
    }

    setLoading(true);
    try {
      const isFollowed = UserInteractionService.follow(contentType, contentId, metadata);
      updateStats();
      
      if (isFollowed) {
        toast.success('✨ Now following!', {
          icon: '✨',
          style: {
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8'
          }
        });
      } else {
        toast.success('Unfollowed', {
          style: {
            background: '#f3f4f6',
            color: '#6b7280'
          }
        });
      }
    } catch (error) {
      toast.error('Failed to update follow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Like Button */}
      <div className="relative group">
        <button
          onClick={handleLike}
          disabled={loading}
          onMouseEnter={() => setShowTooltip('like')}
          onMouseLeave={() => setShowTooltip(null)}
          className={`relative flex items-center justify-center min-w-[80px] px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            stats.isLiked
              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg hover:from-pink-600 hover:to-red-600'
              : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center space-x-1">
            {stats.isLiked ? (
              <Heart className="w-4 h-4 fill-current animate-pulse flex-shrink-0" />
            ) : (
              <Heart className="w-4 h-4 group-hover:animate-bounce flex-shrink-0" />
            )}
            <span className="font-semibold text-xs whitespace-nowrap">{stats.likes}</span>
          </div>
          {stats.isLiked && (
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-ping" />
            </div>
          )}
        </button>
        
        {/* Tooltip */}
        {showTooltip === 'like' && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
            {user ? (stats.isLiked ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to like'}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Follow Button */}
      <div className="relative group">
        <button
          onClick={handleFollow}
          disabled={loading}
          onMouseEnter={() => setShowTooltip('follow')}
          onMouseLeave={() => setShowTooltip(null)}
          className={`relative flex items-center justify-center min-w-[80px] px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            stats.isFollowed
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600'
              : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center space-x-1">
            {stats.isFollowed ? (
              <UserMinus className="w-4 h-4 flex-shrink-0" />
            ) : (
              <UserPlus className="w-4 h-4 group-hover:animate-bounce flex-shrink-0" />
            )}
            <span className="font-semibold text-xs whitespace-nowrap">{stats.follows}</span>
          </div>
          {stats.isFollowed && (
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-ping" />
            </div>
          )}
        </button>
        
        {/* Tooltip */}
        {showTooltip === 'follow' && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
            {user ? (stats.isFollowed ? 'Unfollow' : 'Follow for updates') : 'Sign in to follow'}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractionButtons; 