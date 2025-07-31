import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Tag, TrendingUp, X, Filter } from 'lucide-react';
import { useTrending } from '../contexts/TrendingContext';
import { TrendingItem } from '../utils/trendingExtractor';

interface TrendingFilterProps {
  onFilterChange: (filter: { type: 'hashtag' | 'category'; value: string } | null) => void;
  currentFilter: { type: 'hashtag' | 'category'; value: string } | null;
  defaultTab?: 'hashtags' | 'categories';
  onViewFilteredContent?: () => void;
  mode?: 'hashtags-only' | 'categories-only' | 'unified';
}

const TrendingFilter: React.FC<TrendingFilterProps> = ({ onFilterChange, currentFilter, defaultTab = 'hashtags', onViewFilteredContent, mode = 'unified' }) => {
  const { getTopHashtags, getTopCategories } = useTrending();
  const [activeTab, setActiveTab] = useState<'hashtags' | 'categories'>(defaultTab);

  const topHashtags = getTopHashtags(15);
  const topCategories = getTopCategories(10);

  const handleFilterClick = (type: 'hashtag' | 'category', value: string) => {
    if (currentFilter?.type === type && currentFilter?.value === value) {
      onFilterChange(null); // Clear filter if same item clicked
    } else {
      onFilterChange({ type, value });
    }
  };

  const clearFilter = () => {
    onFilterChange(null);
  };

  const renderTrendingItem = (item: TrendingItem, type: 'hashtag' | 'category') => {
    const isActive = currentFilter?.type === type && currentFilter?.value === item.name;
    const Icon = type === 'hashtag' ? Hash : Tag;

    return (
      <motion.button
        key={item.name}
        onClick={() => handleFilterClick(type, item.name)}
        className={`
          flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200
          ${isActive 
            ? 'bg-black text-white shadow-md' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-black'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium">{item.name}</span>
          {item.count > 5 && (
            <div className="flex items-center space-x-1 text-xs opacity-70">
              <TrendingUp className="w-3 h-3" />
              <span>{item.count}</span>
            </div>
          )}
        </div>
        {isActive && <X className="w-4 h-4" />}
      </motion.button>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-black">Trending Filters</h3>
        </div>
        {currentFilter && (
          <div className="flex items-center space-x-2">
            {onViewFilteredContent && (
              <button
                onClick={onViewFilteredContent}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>View Content</span>
              </button>
            )}
            <button
              onClick={clearFilter}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Display */}
      {currentFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentFilter.type === 'hashtag' ? (
                <Hash className="w-4 h-4 text-blue-600" />
              ) : (
                <Tag className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-sm font-medium text-blue-800">
                Filtering by: <span className="font-semibold">{currentFilter.value}</span>
              </span>
            </div>
            <button
              onClick={clearFilter}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation - Only show in unified mode */}
      {mode === 'unified' && (
        <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('hashtags')}
            className={`
              flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'hashtags'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
              }
            `}
          >
            Hashtags ({topHashtags.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`
              flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'categories'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
              }
            `}
          >
            Categories ({topCategories.length})
          </button>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        {/* Show hashtags only in hashtags-only mode or when hashtags tab is active in unified mode */}
        {(mode === 'hashtags-only' || (mode === 'unified' && activeTab === 'hashtags')) && (
          topHashtags.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {topHashtags.map(item => renderTrendingItem(item, 'hashtag'))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No trending hashtags yet</p>
              <p className="text-sm">Hashtags will appear as you browse content</p>
            </div>
          )
        )}

        {/* Show categories only in categories-only mode or when categories tab is active in unified mode */}
        {(mode === 'categories-only' || (mode === 'unified' && activeTab === 'categories')) && (
          topCategories.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {topCategories.map(item => renderTrendingItem(item, 'category'))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No trending categories yet</p>
              <p className="text-sm">Categories will appear as you browse content</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TrendingFilter; 