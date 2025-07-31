import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Check,
  X,
  Settings,
  Save,
  Youtube,
  Coins,
  Newspaper,
  Music2,
  TrendingUp,
  Hash,
  Folder,
  Users
} from 'lucide-react';
import { useTrending } from '../contexts/TrendingContext';
import RedditIcon from './icons/RedditIcon';
import BlueskyIcon from './icons/BlueskyIcon';
import HackerNewsIcon from './icons/HackerNewsIcon';

export interface MegaFilterState {
  platforms: string[];
  contentTypes: string[];
  hashtags: string[];
  categories: string[];
  searchQuery: string;
  sortBy: 'relevance' | 'date' | 'popularity';
}

interface InlineMegaFilterProps {
  onApplyFilters: (filters: MegaFilterState) => void;
  currentFilters: MegaFilterState;
  onClearFilters: () => void;
}

const InlineMegaFilter: React.FC<InlineMegaFilterProps> = ({ 
  onApplyFilters, 
  currentFilters,
  onClearFilters
}) => {
  const { getTopHashtags, getTopCategories } = useTrending();
  const [filters, setFilters] = useState<MegaFilterState>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['platforms', 'search']));

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: 'Youtube' },
    { id: 'reddit', name: 'Reddit', icon: 'RedditIcon' },
    { id: 'bluesky', name: 'Bluesky', icon: 'BlueskyIcon' },
    { id: 'hackernews', name: 'Hacker News', icon: 'HackerNewsIcon' },
    { id: 'crypto', name: 'Crypto', icon: 'Coins' },
    { id: 'news', name: 'News', icon: 'Newspaper' },
    { id: 'music', name: 'Music', icon: 'Music2' }
  ];

  const contentTypes = [
    { id: 'trending', name: 'Trending', icon: 'TrendingUp' },
    { id: 'hashtags', name: 'Hashtags', icon: 'Hash' },
    { id: 'categories', name: 'Categories', icon: 'Folder' },
    { id: 'creators', name: 'Creators', icon: 'Users' }
  ];

  const sortOptions = [
    { id: 'relevance', name: 'Relevance' },
    { id: 'date', name: 'Date' },
    { id: 'popularity', name: 'Popularity' }
  ];

  const topHashtags = getTopHashtags(15);
  const topCategories = getTopCategories(10);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const togglePlatform = useCallback((platformId: string) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  }, []);

  const toggleContentType = useCallback((typeId: string) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(typeId)
        ? prev.contentTypes.filter(t => t !== typeId)
        : [...prev.contentTypes, typeId]
    }));
  }, []);

  const toggleHashtag = useCallback((hashtag: string) => {
    setFilters(prev => ({
      ...prev,
      hashtags: prev.hashtags.includes(hashtag)
        ? prev.hashtags.filter(h => h !== hashtag)
        : [...prev.hashtags, hashtag]
    }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const updateSortBy = useCallback((sortBy: 'relevance' | 'date' | 'popularity') => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const clearAllFilters = useCallback(() => {
    const emptyFilters = {
      platforms: [],
      contentTypes: [],
      hashtags: [],
      categories: [],
      searchQuery: '',
      sortBy: 'relevance' as const
    };
    setFilters(emptyFilters);
    onClearFilters();
  }, [onClearFilters]);

  const applyFilters = useCallback(() => {
    onApplyFilters(filters);
  }, [filters, onApplyFilters]);

  const renderSection = (
    title: string,
    items: Array<{ id: string; name: string; icon?: string }>,
    selectedItems: string[],
    onToggle: (id: string) => void,
    sectionKey: string
  ) => {
    const getIconComponent = (iconName: string) => {
      const iconMap: { [key: string]: any } = {
        Youtube,
        RedditIcon,
        BlueskyIcon,
        HackerNewsIcon,
        Coins,
        Newspaper,
        Music2,
        TrendingUp,
        Hash,
        Folder,
        Users
      };
      return iconMap[iconName] || null;
    };
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full py-3 text-left"
        >
          <span className="font-medium text-black">{title}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors
                      ${selectedItems.includes(item.id)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {item.icon && getIconComponent(item.icon) && React.createElement(getIconComponent(item.icon), { className: "w-4 h-4" })}
                    <span>{item.name}</span>
                    {selectedItems.includes(item.id) && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderTagSection = (
    title: string,
    items: Array<{ name: string; count: number }>,
    selectedItems: string[],
    onToggle: (id: string) => void,
    sectionKey: string
  ) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full py-3 text-left"
        >
          <span className="font-medium text-black">{title}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-2">
                {items.map(item => (
                  <button
                    key={item.name}
                    onClick={() => onToggle(item.name)}
                    className={`
                      flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors
                      ${selectedItems.includes(item.name)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs opacity-70">({item.count})</span>
                    {selectedItems.includes(item.name) && <Check className="w-2 h-2" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const hasActiveFilters = filters.platforms.length > 0 || 
                          filters.contentTypes.length > 0 || 
                          filters.hashtags.length > 0 || 
                          filters.categories.length > 0 || 
                          filters.searchQuery.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-black">Advanced Filters</h2>
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {filters.platforms.length + filters.contentTypes.length + filters.hashtags.length + filters.categories.length} active
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search across all content..."
            value={filters.searchQuery}
            onChange={(e) => updateSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {renderSection('Platforms', platforms, filters.platforms, togglePlatform, 'platforms')}
          {renderSection('Content Types', contentTypes, filters.contentTypes, toggleContentType, 'contentTypes')}
        </div>
        
        <div className="space-y-4">
          {renderTagSection('Hashtags', topHashtags, filters.hashtags, toggleHashtag, 'hashtags')}
          {renderTagSection('Categories', topCategories, filters.categories, toggleCategory, 'categories')}
          
          {/* Sort Options */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between py-3">
              <span className="font-medium text-black">Sort By</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {sortOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => updateSortBy(option.id as any)}
                  className={`
                    px-3 py-2 rounded-lg text-sm transition-colors
                    ${filters.sortBy === option.id
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Active Filters:</span>
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.platforms.map(platform => (
              <span key={platform} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {platform}
              </span>
            ))}
            {filters.contentTypes.map(type => (
              <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {type}
              </span>
            ))}
            {filters.hashtags.map(hashtag => (
              <span key={hashtag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                #{hashtag}
              </span>
            ))}
            {filters.categories.map(category => (
              <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {category}
              </span>
            ))}
            {filters.searchQuery && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{filters.searchQuery}"
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InlineMegaFilter; 