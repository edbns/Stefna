import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Youtube, 
  MessageSquare, 
  Coins, 
  Newspaper, 
  Music,
  Clock,
  Eye,
  Heart,
  Share2
} from 'lucide-react';
import RedditIcon from './icons/RedditIcon';
import BlueskyIcon from './icons/BlueskyIcon';
import HackerNewsIcon from './icons/HackerNewsIcon';
import { useAuth } from '../contexts/AuthContext';
import { useTrending } from '../contexts/TrendingContext';
import InteractionButtons from './InteractionButtons';
import AIFeatureButtons from './AIFeatureButtons';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface GlobalContent {
  id: string;
  platform: string;
  title: string;
  description?: string;
  url?: string;
  author?: string;
  timestamp: number;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
    upvotes?: number;
  };
  thumbnail?: string;
  metadata?: any;
}

const GlobalReach: React.FC = () => {
  const [content, setContent] = useState<GlobalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addTrends } = useTrending();

  // Mock data for demonstration - in real implementation, this would fetch from all platforms
  const mockGlobalContent: GlobalContent[] = [
    {
      id: '1',
      platform: 'youtube',
      title: 'AI Revolution: How ChatGPT is Changing Everything',
      description: 'A comprehensive look at how AI is transforming industries worldwide',
      url: 'https://youtube.com/watch?v=example1',
      author: 'TechExplained',
      timestamp: Date.now() - 3600000,
      engagement: { views: 1250000, likes: 45000, comments: 2300 },
      thumbnail: 'https://via.placeholder.com/300x200/FF0000/FFFFFF?text=YouTube'
    },
    {
      id: '2',
      platform: 'reddit',
      title: 'What\'s the most underrated skill that everyone should learn?',
      description: 'Reddit users share their thoughts on essential life skills',
      url: 'https://reddit.com/r/AskReddit/comments/example',
      author: 'u/skillsharer',
      timestamp: Date.now() - 7200000,
      engagement: { upvotes: 15420, comments: 890 },
      metadata: { subreddit: 'AskReddit' }
    },
    {
      id: '3',
      platform: 'bluesky',
      title: 'Just discovered this amazing new restaurant downtown! The food was incredible and the atmosphere was perfect for a date night.',
      description: 'Social media post about a dining experience',
      author: '@foodlover',
      timestamp: Date.now() - 10800000,
      engagement: { likes: 45, comments: 12 }
    },
    {
      id: '4',
      platform: 'hackernews',
      title: 'Show HN: I built a tool that automatically generates documentation from code',
      description: 'Developer shares their latest project with the community',
      url: 'https://github.com/example/doc-generator',
      author: 'dev_creator',
      timestamp: Date.now() - 14400000,
      engagement: { upvotes: 234, comments: 67 }
    },
    {
      id: '5',
      platform: 'crypto',
      title: 'Bitcoin Surges Past $50,000 as Institutional Adoption Grows',
      description: 'Major cryptocurrency reaches new milestone',
      author: 'CryptoNews',
      timestamp: Date.now() - 18000000,
      engagement: { views: 89000, likes: 1200 }
    },
    {
      id: '6',
      platform: 'news',
      title: 'Breakthrough in Renewable Energy: New Solar Panel Technology Achieves 40% Efficiency',
      description: 'Scientists develop revolutionary solar technology',
      url: 'https://example-news.com/solar-breakthrough',
      author: 'Science Daily',
      timestamp: Date.now() - 21600000,
      engagement: { views: 156000, likes: 3400 }
    },
    {
      id: '7',
      platform: 'music',
      title: 'New Album Release: "Midnight Dreams" by The Midnight Collective',
      description: 'Alternative rock band releases highly anticipated album',
      author: 'The Midnight Collective',
      timestamp: Date.now() - 25200000,
      engagement: { views: 45000, likes: 890 }
    }
  ];

  useEffect(() => {
    const loadGlobalContent = async () => {
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sort by timestamp (newest first)
        const sortedContent = mockGlobalContent.sort((a, b) => b.timestamp - a.timestamp);
        setContent(sortedContent);
        
        // Add trends to global context
        addTrends(sortedContent, 'global');
        
      } catch (error) {
        console.error('Error loading global content:', error);
        setError('Failed to load global content');
      } finally {
        setLoading(false);
      }
    };

    loadGlobalContent();
  }, [addTrends]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return Youtube;
      case 'reddit':
        return RedditIcon;
      case 'bluesky':
        return BlueskyIcon;
      case 'hackernews':
        return HackerNewsIcon;
      case 'crypto':
        return Coins;
      case 'news':
        return Newspaper;
      case 'music':
        return Music;
      default:
        return Globe;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return 'bg-red-500';
      case 'reddit':
        return 'bg-orange-500';
      case 'bluesky':
        return 'bg-blue-500';
      case 'hackernews':
        return 'bg-orange-600';
      case 'crypto':
        return 'bg-yellow-500';
      case 'news':
        return 'bg-blue-600';
      case 'music':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatEngagement = (engagement: any) => {
    if (engagement.views) {
      return engagement.views > 1000000 
        ? `${(engagement.views / 1000000).toFixed(1)}M views`
        : engagement.views > 1000 
        ? `${(engagement.views / 1000).toFixed(1)}K views`
        : `${engagement.views} views`;
    }
    if (engagement.upvotes) {
      return engagement.upvotes > 1000 
        ? `${(engagement.upvotes / 1000).toFixed(1)}K upvotes`
        : `${engagement.upvotes} upvotes`;
    }
    if (engagement.likes) {
      return `${engagement.likes} likes`;
    }
    return '';
  };

  const handleAuthPrompt = () => {
    if (!user) {
      toast.error('Please sign in to interact with content');
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 bg-white">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Global Reach</h1>
          <p className="text-gray-600">Trending content from all platforms</p>
        </div>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 bg-white">
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-black mb-2">Failed to load content</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-black">Global Reach</h1>
          <p className="text-gray-600">Trending content from all platforms</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {content.map((item, index) => {
            const PlatformIcon = getPlatformIcon(item.platform);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 group"
              >
                {/* Platform Badge */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${getPlatformColor(item.platform)} rounded-full flex items-center justify-center`}>
                      <PlatformIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 capitalize">
                      {item.platform}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-black line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Author */}
                  {item.author && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500">by</span>
                      <span className="text-xs font-medium text-gray-700">{item.author}</span>
                    </div>
                  )}

                  {/* Engagement */}
                  {item.engagement && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      {item.engagement.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatEngagement(item.engagement)}</span>
                        </div>
                      )}
                      {item.engagement.upvotes && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{formatEngagement(item.engagement)}</span>
                        </div>
                      )}
                      {item.engagement.likes && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{item.engagement.likes} likes</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interaction Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                         <InteractionButtons
                       contentType={item.platform as any}
                       contentId={item.id}
                       metadata={{
                         title: item.title,
                         author: item.author,
                         url: item.url,
                         platform: item.platform
                       }}
                       onAuthOpen={handleAuthPrompt}
                     />
                    
                    {/* AI Feature Buttons */}
                    <AIFeatureButtons
                      content={item.title}
                      platform={item.platform}
                      onAuthOpen={handleAuthPrompt}
                      className="text-xs"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {content.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-black mb-2">No content found</h3>
          <p className="text-gray-500">Try refreshing to load trending content from all platforms</p>
        </div>
      )}
    </div>
  );
};

export default GlobalReach;