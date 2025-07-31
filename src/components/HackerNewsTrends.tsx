import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ExternalLink, TrendingUp, Clock, User, ArrowUp } from 'lucide-react';
import HackerNewsService, { HackerNewsStory } from '../services/HackerNewsService';
import InteractionButtons from './InteractionButtons';
import LoadingSpinner from './LoadingSpinner';
import { useTrending } from '../contexts/TrendingContext';
import toast from 'react-hot-toast';

interface HackerNewsTrendsProps {
  onAuthOpen: () => void;
}

const HackerNewsTrends: React.FC<HackerNewsTrendsProps> = ({ onAuthOpen }) => {
  const [stories, setStories] = useState<HackerNewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { addTrends } = useTrending();

  const fetchStories = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const limit = 15;
      const newStories = await HackerNewsService.getTrendingStories(limit);
      
      if (pageNum === 1) {
        setStories(newStories);
      } else {
        setStories(prev => [...prev, ...newStories]);
      }
      
      setHasMore(newStories.length === limit);
      setPage(pageNum);
      
      // Extract trending hashtags and categories from Hacker News stories
      if (newStories.length > 0) {
        addTrends(newStories, 'hackernews');
      }
    } catch (error) {
      console.error('Error fetching Hacker News stories:', error);
      toast.error('Failed to load Hacker News stories');
    } finally {
      setLoading(false);
    }
  }, [addTrends]);

  const loadMoreStories = useCallback(async () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      try {
        const nextPage = page + 1;
        const limit = 15;
        const newStories = await HackerNewsService.getTrendingStories(limit);
        
        setStories(prev => [...prev, ...newStories]);
        setHasMore(newStories.length === limit);
        setPage(nextPage);
        
        // Extract trending hashtags and categories from new stories
        if (newStories.length > 0) {
          addTrends(newStories, 'hackernews');
        }
      } catch (error) {
        console.error('Error loading more stories:', error);
        toast.error('Failed to load more stories');
      } finally {
        setLoadingMore(false);
      }
    }
  }, [hasMore, loadingMore, page, addTrends]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          loadMoreStories();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreStories, hasMore, loadingMore]);

  useEffect(() => {
    fetchStories(1);
  }, [fetchStories]);

  const handleAuthPrompt = () => {
    onAuthOpen();
  };

  const handleStoryClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatNumber = (num: number): string => {
    return HackerNewsService.formatNumber(num);
  };

  const formatTimestamp = (timestamp: number): string => {
    return HackerNewsService.formatTimestamp(timestamp);
  };

  const extractDomain = (url: string): string => {
    return HackerNewsService.extractDomain(url);
  };

  if (loading && stories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (stories.length === 0 && !loading) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-orange-500" />
        </div>
        <h3 className="text-xl font-semibold text-black mb-3">No Hacker News stories found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          We're currently gathering trending stories from Hacker News. Check back soon for the latest content.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => fetchStories(1)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 bg-white">
      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Story Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Y</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{story.by}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{story.score}</span>
                </div>
              </div>
            </div>

            {/* Story Content */}
            <div className="p-4">
              <h3 className="font-semibold text-black mb-3 line-clamp-3 leading-tight">
                {story.title}
              </h3>
              
              {/* Domain Badge */}
              <div className="mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  {extractDomain(story.url)}
                </span>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="w-4 h-4" />
                    <span>{formatNumber(story.score)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(story.descendants)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(story.time)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <InteractionButtons
                  contentType="hackernews"
                  contentId={story.id.toString()}
                  metadata={{
                    title: story.title,
                    author: story.by,
                    platform: 'hackernews',
                    url: story.url
                  }}
                  onAuthOpen={handleAuthPrompt}
                />
                
                <button
                  onClick={() => handleStoryClick(story.url)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-black transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Read</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More Indicator */}
      {hasMore && (
        <div ref={loaderRef} className="flex items-center justify-center py-8">
          {loadingMore ? (
            <LoadingSpinner size="md" />
          ) : (
            <div className="text-gray-500 text-sm">Loading more stories...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default HackerNewsTrends; 