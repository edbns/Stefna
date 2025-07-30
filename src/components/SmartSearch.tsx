import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Calendar, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface SmartSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
  platforms?: FilterOption[];
  categories?: FilterOption[];
  dateRange?: { start: Date; end: Date };
  placeholder?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onFilterChange,
  platforms = [],
  categories = [],
  dateRange,
  placeholder = "Search content, creators, hashtags..."
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Update filters
  useEffect(() => {
    onFilterChange({
      platforms: selectedPlatforms,
      categories: selectedCategories,
      dateRange: selectedDateRange
    });
  }, [selectedPlatforms, selectedCategories, selectedDateRange, onFilterChange]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearAllFilters = () => {
    setSelectedPlatforms([]);
    setSelectedCategories([]);
    setSelectedDateRange('all');
    setQuery('');
  };

  const activeFiltersCount = selectedPlatforms.length + selectedCategories.length + (selectedDateRange !== 'all' ? 1 : 0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="relative">
        <div className={`relative flex items-center bg-white rounded-xl border-2 transition-all duration-200 ${
          isSearchFocused ? 'border-blue-300 shadow-lg' : 'border-gray-200 shadow-sm'
        }`}>
          <Search className="w-5 h-5 ml-4 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={placeholder}
            className="flex-1 px-4 py-4 bg-transparent border-none outline-none font-figtree text-lg"
            style={{ color: '#2a4152' }}
          />
          
          {/* Keyboard Shortcut Hint */}
          {!isSearchFocused && !query && (
            <div className="hidden md:flex items-center space-x-1 mr-4 text-gray-400 text-sm font-figtree">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘</kbd>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">K</kbd>
            </div>
          )}
          
          {/* Clear Search */}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="mr-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 mr-2 rounded-lg font-medium font-figtree transition-all duration-200 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-4 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold font-figtree" style={{ color: '#2a4152' }}>
                  Advanced Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-figtree transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Platforms Filter */}
                <div>
                  <label className="block text-sm font-medium font-figtree mb-3" style={{ color: '#2a4152' }}>
                    Platforms
                  </label>
                  <div className="space-y-2">
                    {platforms.map(platform => (
                      <label key={platform.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform.id)}
                          onChange={() => togglePlatform(platform.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-figtree" style={{ color: '#2a4152' }}>
                          {platform.label}
                        </span>
                        {platform.count && (
                          <span className="text-xs text-gray-500 font-figtree">({platform.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Categories Filter */}
                <div>
                  <label className="block text-sm font-medium font-figtree mb-3" style={{ color: '#2a4152' }}>
                    Categories
                  </label>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-figtree" style={{ color: '#2a4152' }}>
                          {category.label}
                        </span>
                        {category.count && (
                          <span className="text-xs text-gray-500 font-figtree">({category.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium font-figtree mb-3" style={{ color: '#2a4152' }}>
                    Time Period
                  </label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-figtree"
                    style={{ color: '#2a4152' }}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap gap-2"
        >
          {selectedPlatforms.map(platformId => {
            const platform = platforms.find(p => p.id === platformId);
            return platform ? (
              <span
                key={platformId}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-figtree"
              >
                <span>{platform.label}</span>
                <button
                  onClick={() => togglePlatform(platformId)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}
          
          {selectedCategories.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <span
                key={categoryId}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-figtree"
              >
                <span>{category.label}</span>
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}
          
          {selectedDateRange !== 'all' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-figtree">
              <Calendar className="w-3 h-3" />
              <span>{selectedDateRange}</span>
              <button
                onClick={() => setSelectedDateRange('all')}
                className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SmartSearch;