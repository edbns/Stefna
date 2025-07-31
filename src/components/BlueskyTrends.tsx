import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Eye, ExternalLink, Hash, TrendingUp } from 'lucide-react';
import BlueskyService, { BlueskyPost } from '../services/BlueskyService';
import InteractionButtons from './InteractionButtons';
import LoadingSpinner from './LoadingSpinner';
import { useTrending } from '../contexts/TrendingContext';
import toast from 'react-hot-toast';

interface BlueskyTrendsProps {
  onAuthOpen: () => void;
}

const BlueskyTrends: React.FC<BlueskyTrendsProps> = ({ onAuthOpen }) => {
  const [posts, setPosts] = useState<BlueskyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { addTrends } = useTrending();

  const fetchPosts = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const limit = 15;
      const newPosts = await BlueskyService.getTrendingPosts(limit);
      
      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === limit);
      setPage(pageNum);
      
      // Extract trending hashtags and categories from Bluesky posts
      if (newPosts.length > 0) {
        addTrends(newPosts, 'bluesky');
      }
    } catch (error) {
      console.error('Error fetching Bluesky posts:', error);
      toast.error('Failed to load Bluesky posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      try {
        const nextPage = page + 1;
        const limit = 15;
        const newPosts = await BlueskyService.getTrendingPosts(limit);
        
        setPosts(prev => [...prev, ...newPosts]);
        setHasMore(newPosts.length === limit);
        setPage(nextPage);
        
        // Extract trending hashtags and categories from new Bluesky posts
        if (newPosts.length > 0) {
          addTrends(newPosts, 'bluesky');
        }
      } catch (error) {
        console.error('Error loading more posts:', error);
        toast.error('Failed to load more posts');
      } finally {
        setLoadingMore(false);
      }
    }
  }, [hasMore, loadingMore, page]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMorePosts, hasMore, loadingMore]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleAuthPrompt = () => {
    onAuthOpen();
  };

  const handlePostClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatNumber = (num: number): string => {
    return BlueskyService.formatNumber(num);
  };

  const formatTimestamp = (timestamp: string): string => {
    return BlueskyService.formatTimestamp(timestamp);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-black mb-3">No Bluesky posts found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          We're currently gathering trending posts from Bluesky. Check back soon for the latest content.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => fetchPosts(1)}
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
      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Post Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {post.author.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {post.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <h3 className="font-semibold text-black truncate">{post.author.name}</h3>
                    {post.author.verified && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{post.author.username}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{post.trendingScore}</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              <p className="text-gray-800 mb-3 line-clamp-3">{post.description}</p>
              
              {/* Media */}
              {post.media && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <img 
                    src={post.media.url} 
                    alt={post.media.alt}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Hashtags */}
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.hashtags.slice(0, 3).map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(post.engagement.likes)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Repeat2 className="w-4 h-4" />
                    <span>{formatNumber(post.engagement.reposts)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(post.engagement.replies)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(post.engagement.views)}</span>
                  </div>
                </div>
                <span className="text-xs">{formatTimestamp(post.timestamp)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <InteractionButtons
                  contentType="bluesky"
                  contentId={post.id}
                  metadata={{
                    title: post.title,
                    author: post.author.name,
                    platform: 'bluesky',
                    url: post.url
                  }}
                  onAuthOpen={handleAuthPrompt}
                />
                
                <button
                  onClick={() => handlePostClick(post.url)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-black transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View</span>
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
            <div className="text-gray-500 text-sm">Loading more posts...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlueskyTrends; 