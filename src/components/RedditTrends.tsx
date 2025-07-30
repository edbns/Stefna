import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ArrowUp, MessageCircle, ExternalLink, Clock, Image as ImageIcon } from 'lucide-react';
import { RedditService, RedditPost } from '../services/RedditService';
import LoadingSpinner from './LoadingSpinner';
import InteractionButtons from './InteractionButtons';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RedditTrendsProps {
  onAuthOpen?: () => void;
}

const RedditTrends: React.FC<RedditTrendsProps> = ({ onAuthOpen }) => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [after, setAfter] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const redditService = RedditService.getInstance();
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, after]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await redditService.getTrendingPosts(25);
      setPosts(response.posts);
      setAfter(response.after || null);
      setHasMore(response.hasMore || false);
    } catch (err) {
      setError('Failed to load Reddit posts');
      console.error('Reddit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore || !after) return;

    try {
      setLoadingMore(true);
      const response = await redditService.getTrendingPosts(25, after);
      setPosts(prev => [...prev, ...response.posts]);
      setAfter(response.after || null);
      setHasMore(response.hasMore || false);
    } catch (err) {
      console.error('Error loading more Reddit posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, after]);

  const handleRefresh = () => {
    redditService.clearCache();
    setPosts([]);
    setAfter(null);
    setHasMore(true);
    fetchPosts();
  };

  const handleAuthPrompt = () => {
    onAuthOpen?.();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Reddit Trends</h1>
                <p className="text-gray-500">Top posts from r/popular</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Reddit Trends</h1>
                <p className="text-gray-500">Top posts from r/popular</p>
              </div>
            </div>
          </div>
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Failed to load Reddit posts</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Reddit Trends</h1>
              <p className="text-gray-500">Top posts from r/popular ({posts.length} posts)</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group overflow-hidden"
              >
                {/* Trending Badge */}
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-orange-600 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                        Trending
                      </span>
                    </div>
                  </div>
                  
                  {/* Thumbnail or Placeholder */}
                  {post.thumbnail ? (
                    <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-orange-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-orange-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="font-semibold text-black line-clamp-2 group-hover:text-orange-600 transition-colors mb-3">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {post.title}
                    </a>
                  </h3>

                  {/* Subreddit and Author */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        r/{post.subreddit}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">u/{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{redditService.formatTimeAgo(post.created)}</span>
                    </div>
                  </div>

                  {/* Stats and Interactions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      {/* Upvotes */}
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <ArrowUp className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">{redditService.formatUpvotes(post.upvotes)}</span>
                      </div>
                      {/* Comments */}
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-medium">{redditService.formatUpvotes(post.numComments)}</span>
                      </div>
                    </div>
                    
                    {/* Interaction Buttons */}
                    <InteractionButtons
                      contentType="reddit"
                      contentId={post.id}
                      metadata={{
                        title: post.title,
                        subreddit: post.subreddit,
                        author: post.author,
                        url: post.url
                      }}
                      onAuthOpen={handleAuthPrompt}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More Indicator */}
        {hasMore && (
          <div ref={loaderRef} className="flex justify-center py-8">
            {loadingMore ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-gray-500">Loading more posts...</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-sm text-gray-500">Scroll to load more</p>
              </div>
            )}
          </div>
        )}

        {/* No More Posts */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No more posts to load</p>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">No Reddit posts found</h3>
            <p className="text-gray-500">Try refreshing to load trending posts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedditTrends; 