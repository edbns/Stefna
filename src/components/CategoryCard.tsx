import React from 'react';
import { motion } from 'framer-motion';
import FollowButton from './FollowButton';

interface CategoryCardProps {
  category: string;
  description?: string;
  postCount?: number;
  icon?: string;
  onAuthRequired?: () => void;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  description,
  postCount,
  icon,
  onAuthRequired,
  onClick
}) => {
  const defaultIcons: { [key: string]: string } = {
    'Technology': '💻',
    'Fashion': '👗',
    'Food': '🍕',
    'Travel': '✈️',
    'Fitness': '💪',
    'Music': '🎵',
    'Art': '🎨',
    'Gaming': '🎮',
    'Business': '💼',
    'Education': '📚'
  };

  const categoryIcon = icon || defaultIcons[category] || '📂';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer"
      style={{ fontFamily: 'Figtree, sans-serif' }}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
          {categoryIcon}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg" style={{ color: '#2a4152' }}>
            {category}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">
              {description}
            </p>
          )}
          {postCount && (
            <p className="text-xs text-gray-500 mt-1">
              {postCount.toLocaleString()} posts this week
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
        </div>
        
        <FollowButton
          type="category"
          item={category}
          onAuthRequired={onAuthRequired}
          size="sm"
          variant="primary"
        />
      </div>
    </motion.div>
  );
};

export default CategoryCard;