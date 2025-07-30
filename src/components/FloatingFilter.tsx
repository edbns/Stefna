import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, TrendingUp, Heart, MessageCircle, Share, Eye, Settings, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FloatingFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
  data: any[];
}

interface FilterState {
  searchQuery: string;
  platforms: string[];
  categories: string[];
  creators: string[];
  hashtags: string[];
  locations: string[];
  sentiment: string[];
  engagementRange: { min: number; max: number };
  engagementRateRange: { min: number; max: number };
  trendingScoreRange: { min: number; max: number };
  followerCountRange: { min: number; max: number };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const FloatingFilter: React.FC<FloatingFilterProps> = ({ onSearch, onFilterChange, data }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    platforms: [],
    categories: [],
    creators: [],
    hashtags: [],
    locations: [],
    sentiment: [],
    engagementRange: { min: 0, max: 1000000 },
    engagementRateRange: { min: 0, max: 100 },
    trendingScoreRange: { min: 0, max: 100 },
    followerCountRange: { min: 0, max: 10000000 },
    sortBy: 'trendingScore',
    sortOrder: 'desc'
  });

  const platforms = ['youtube', 'tiktok', 'twitter', 'instagram', 'reddit'];
  const categories = ['Entertainment', 'Music', 'Gaming', 'Sports', 'News', 'Technology', 'Fashion', 'Food'];
  const sentiments = ['positive', 'neutral', 'negative'];
  const sortOptions = [
    { value: 'trendingScore', label: 'Trending Score' },
    { value: 'views', label: 'Views' },
    { value: 'likes', label: 'Likes' },
    { value: 'engagementRate', label: 'Engagement Rate' },
    { value: 'publishedAt', label: 'Date Published' }
  ];

  const handleFilterUpdate = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSearchChange = (query: string) => {
    handleFilterUpdate({ searchQuery: query });
    onSearch(query);
  };

  const toggleArrayFilter = (filterKey: keyof FilterState, value: string) => {
    const currentArray = filters[filterKey] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleFilterUpdate({ [filterKey]: newArray });
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      searchQuery: '',
      platforms: [],
      categories: [],
      creators: [],
      hashtags: [],
      locations: [],
      sentiment: [],
      engagementRange: { min: 0, max: 1000000 },
      engagementRateRange: { min: 0, max: 100 },
      trendingScoreRange: { min: 0, max: 100 },
      followerCountRange: { min: 0, max: 10000000 },
      sortBy: 'trendingScore',
      sortOrder: 'desc' as const
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    count += filters.platforms.length;
    count += filters.categories.length;
    count += filters.creators.length;
    count += filters.hashtags.length;
    count += filters.locations.length;
    count += filters.sentiment.length;
    return count;
  };

  const renderBasicFilters = () => (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black"
          />
        </div>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Platforms</label>
        <div className="grid grid-cols-2 gap-2">
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => toggleArrayFilter('platforms', platform)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filters.platforms.includes(platform)
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Categories</label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => toggleArrayFilter('categories', category)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filters.categories.includes(category)
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Sentiment</label>
        <div className="grid grid-cols-3 gap-2">
          {sentiments.map(sentiment => (
            <button
              key={sentiment}
              onClick={() => toggleArrayFilter('sentiment', sentiment)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                filters.sentiment.includes(sentiment)
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className="space-y-4">
      {/* Engagement Range */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Engagement Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.engagementRange.min}
            onChange={(e) => handleFilterUpdate({ 
              engagementRange: { ...filters.engagementRange, min: Number(e.target.value) }
            })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.engagementRange.max}
            onChange={(e) => handleFilterUpdate({ 
              engagementRange: { ...filters.engagementRange, max: Number(e.target.value) }
            })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black"
          />
        </div>
      </div>

      {/* Trending Score Range */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Trending Score Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.trendingScoreRange.min}
            onChange={(e) => handleFilterUpdate({ 
              trendingScoreRange: { ...filters.trendingScoreRange, min: Number(e.target.value) }
            })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.trendingScoreRange.max}
            onChange={(e) => handleFilterUpdate({ 
              trendingScoreRange: { ...filters.trendingScoreRange, max: Number(e.target.value) }
            })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black"
          />
        </div>
      </div>
    </div>
  );

  const renderSortingOptions = () => (
    <div className="space-y-4">
      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterUpdate({ sortBy: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Order */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Sort Order</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterUpdate({ sortOrder: 'desc' })}
            className={`flex-1 px-3 py-2 rounded-md transition-colors ${
              filters.sortOrder === 'desc'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Descending
          </button>
          <button
            onClick={() => handleFilterUpdate({ sortOrder: 'asc' })}
            className={`flex-1 px-3 py-2 rounded-md transition-colors ${
              filters.sortOrder === 'asc'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Ascending
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 top-20 z-50 flex items-center gap-2 px-4 py-3 rounded-md shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-black text-white' 
            : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <SlidersHorizontal className="w-5 h-5" />
        <span className="font-medium">Filters</span>
        {getActiveFilterCount() > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {getActiveFilterCount()}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Floating Filter Panel */}
      {isOpen && (
        <div className="fixed right-4 top-32 z-40 w-80 bg-white rounded-md shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Filter Tabs */}
            <div className="flex gap-1 mb-4">
              {[
                { id: 'basic', label: 'Basic', icon: Search },
                { id: 'advanced', label: 'Advanced', icon: TrendingUp },
                { id: 'sorting', label: 'Sorting', icon: Filter }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Content */}
            <div>
              {activeTab === 'basic' && renderBasicFilters()}
              {activeTab === 'advanced' && renderAdvancedFilters()}
              {activeTab === 'sorting' && renderSortingOptions()}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {data.length} results found
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingFilter; 