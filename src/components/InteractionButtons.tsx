import React, { useState, useEffect } from 'react';
import { Heart, UserPlus, HeartOff, UserMinus } from 'lucide-react';
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

  useEffect(() => {
    updateStats();
  }, [contentType, contentId]);

  const updateStats = () => {
    const currentStats = UserInteractionService.getStats(contentType, contentId);
    setStats(currentStats);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like content');
      onAuthOpen?.();
      return;
    }

    setLoading(true);
    try {
      const isLiked = UserInteractionService.like(contentType, contentId, metadata);
      updateStats();
      toast.success(isLiked ? 'Liked!' : 'Unliked');
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow content');
      onAuthOpen?.();
      return;
    }

    setLoading(true);
    try {
      const isFollowed = UserInteractionService.follow(contentType, contentId, metadata);
      updateStats();
      toast.success(isFollowed ? 'Following!' : 'Unfollowed');
    } catch (error) {
      toast.error('Failed to update follow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          stats.isLiked
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {stats.isLiked ? (
          <Heart className="w-4 h-4 fill-current" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
        <span>{stats.likes}</span>
      </button>

      {/* Follow Button */}
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          stats.isFollowed
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {stats.isFollowed ? (
          <UserMinus className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        <span>{stats.follows}</span>
      </button>
    </div>
  );
};

export default InteractionButtons; 