import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Users, MessageSquare } from 'lucide-react';
import EnhancedSkeleton from './EnhancedSkeleton';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  metrics: {
    views: number;
    likes: number;
    comments: number;
  };
  publishedAt: string;
  relevanceScore: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  totalCount: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  query,
  totalCount,
  onLoadMore,
  hasMore = false
}) => {
  if (isLoading && results.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex space-x-4">
              <EnhancedSkeleton variant="avatar" width="w-16" height="h-16" className="rounded-lg" />
              <div className="flex-1 space-y-3">
                <EnhancedSkeleton width="w-3/4" height="h-5" />
                <EnhancedSkeleton width="w-full" height="h-4" />
                <EnhancedSkeleton width="w-1/2" height="h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold font-figtree mb-2" style={{ color: '#2a4152' }}>
          {query ? `No results for "${query}"` : 'Start searching'}
        </h3>
        <p className="text-gray-600 font-figtree">
          {query 
            ? 'Try adjusting your search terms or filters'
            : 'Enter a search term to find content, creators, and trends'
          }
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-figtree" style={{ color: '#2a4152' }}>
            Search Results
          </h2>
          <p className="text-gray-600 font-figtree">
            {totalCount.toLocaleString()} results {query && `for "${query}"`}
          </p>
        </div>
        
        {/* Sort Options */}
        <select className="px-3 py-2 border border-gray-300 rounded-lg font-figtree" style={{ color: '#2a4152' }}>
          <option value="relevance">Most Relevant</option>
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
          <option value="trending">Trending</option>
        </select>
      </div>
      
      {/* Results List */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex space-x-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold font-figtree text-lg group-hover:text-blue-600 transition-colors" style={{ color: '#2a4152' }}>
                      {result.title}
                    </h3>
                    <p className="text-gray-600 font-figtree mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  </div>
                  
                  {/* Platform Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium font-figtree ${
                    result.platform === 'youtube' ? 'bg-red-100 text-red-700' :
                    result.platform === 'tiktok' ? 'bg-black text-white' :
                    result.platform === 'twitter' ? 'bg-blue-100 text-blue-700' :
                    'bg-pink-100 text-pink-700'
                  }`}>
                    {result.platform}
                  </span>
                </div>
                
                {/* Creator & Metrics */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <img
                      src={result.creator.avatar}
                      alt={result.creator.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-figtree" style={{ color: '#2a4152' }}>
                      {result.creator.name}
                    </span>
                    {result.creator.verified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 font-figtree">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{result.metrics.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{result.metrics.likes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{result.metrics.comments.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{result.publishedAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium font-figtree hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load More Results'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;