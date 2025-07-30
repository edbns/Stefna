import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FollowButtonProps {
  type: 'hashtag' | 'category' | 'creator';
  item: string;
  onAuthRequired?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'minimal';
}

const FollowButton: React.FC<FollowButtonProps> = ({
  type,
  item,
  onAuthRequired,
  size = 'md',
  variant = 'primary'
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load following status
  useEffect(() => {
    if (user) {
      const followingKey = `following_${type}s`;
      const following = JSON.parse(localStorage.getItem(followingKey) || '[]');
      setIsFollowing(following.includes(item));
    }
  }, [user, type, item]);

  const handleFollow = async () => {
    // If user is not authenticated, trigger auth modal
    if (!user) {
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);
    
    try {
      const followingKey = `following_${type}s`;
      const following = JSON.parse(localStorage.getItem(followingKey) || '[]');
      
      let newFollowing;
      if (isFollowing) {
        newFollowing = following.filter((f: string) => f !== item);
        toast.success(`Unfollowed ${type} "${item}"`);
      } else {
        newFollowing = [...following, item];
        toast.success(`Following ${type} "${item}"`);
      }
      
      localStorage.setItem(followingKey, JSON.stringify(newFollowing));
      setIsFollowing(!isFollowing);
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('followingUpdated', {
        detail: { type, item, isFollowing: !isFollowing }
      }));
      
    } catch (error) {
      console.error('Error updating following status:', error);
      toast.error('Failed to update following status');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    primary: isFollowing 
      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
      : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    secondary: isFollowing
      ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    minimal: isFollowing
      ? 'text-green-600 hover:text-green-700'
      : 'text-blue-600 hover:text-blue-700'
  };

  const baseClasses = variant === 'minimal' 
    ? 'font-medium transition-colors'
    : `border rounded-lg font-medium transition-all duration-200 ${sizeClasses[size]} ${variantClasses[variant]}`;

  return (
    <motion.button
      whileHover={{ scale: variant === 'minimal' ? 1 : 1.02 }}
      whileTap={{ scale: variant === 'minimal' ? 1 : 0.98 }}
      onClick={handleFollow}
      disabled={isLoading}
      className={`${baseClasses} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          <span>...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          {variant !== 'minimal' && (
            <svg 
              className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} 
              fill={isFollowing ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isFollowing ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              )}
            </svg>
          )}
          <span>
            {isFollowing ? 'Following' : 'Follow'}
          </span>
        </div>
      )}
    </motion.button>
  );
};

export default FollowButton;