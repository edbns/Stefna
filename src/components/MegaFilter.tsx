import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, TrendingUp, Heart, MessageCircle, Share, Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MegaFilterProps {
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

const MegaFilter: React.FC<MegaFilterProps> = ({ onSearch, onFilterChange, data }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search content, creators, hashtags..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Platform Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter.platforms')}</label>
        <div className="flex flex-wrap gap-2">
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => toggleArrayFilter('platforms', platform)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.platforms.includes(platform)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter.categories')}</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => toggleArrayFilter('categories', category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.categories.includes(category)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter.sentiment')}</label>
        <div className="flex gap-2">
          {sentiments.map(sentiment => (
            <button
              key={sentiment}
              onClick={() => toggleArrayFilter('sentiment', sentiment)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.sentiment.includes(sentiment)
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter.engagement')}</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder={t('ui.min')}
            value={filters.engagementRange.min}
            onChange={(e) => handleFilterUpdate({
              engagementRange: { ...filters.engagementRange, min: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">{t('ui.to')}</span>
          <input
            type="number"
            placeholder={t('ui.max')}
            value={filters.engagementRange.max}
            onChange={(e) => handleFilterUpdate({
              engagementRange: { ...filters.engagementRange, max: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Engagement Rate Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter.engagement.rate')}</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.engagementRateRange.min}
            onChange={(e) => handleFilterUpdate({
              engagementRateRange: { ...filters.engagementRateRange, min: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.engagementRateRange.max}
            onChange={(e) => handleFilterUpdate({
              engagementRateRange: { ...filters.engagementRateRange, max: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Trending Score Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter.trending.score')}</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.trendingScoreRange.min}
            onChange={(e) => handleFilterUpdate({
              trendingScoreRange: { ...filters.trendingScoreRange, min: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.trendingScoreRange.max}
            onChange={(e) => handleFilterUpdate({
              trendingScoreRange: { ...filters.trendingScoreRange, max: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Follower Count Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Creator Follower Count</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.followerCountRange.min}
            onChange={(e) => handleFilterUpdate({
              followerCountRange: { ...filters.followerCountRange, min: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.followerCountRange.max}
            onChange={(e) => handleFilterUpdate({
              followerCountRange: { ...filters.followerCountRange, max: Number(e.target.value) }
            })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderSortingOptions = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterUpdate({ sortBy: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleFilterUpdate({ 
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              filters.sortOrder === 'desc'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filters.sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Filter Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </button>
          
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {data.length} results
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Filter Tabs */}
          <div className="flex gap-1 mb-4 mt-4">
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
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
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'basic' && renderBasicFilters()}
            {activeTab === 'advanced' && renderAdvancedFilters()}
            {activeTab === 'sorting' && renderSortingOptions()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MegaFilter;