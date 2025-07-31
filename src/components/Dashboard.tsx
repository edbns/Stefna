import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu, Search, LogIn, LogOut, User, Filter, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ContentCard from './ContentCard';
import LoadingSpinner from './LoadingSpinner';
import Schedule from './Schedule';
import toast from 'react-hot-toast';
import Settings from './Settings';
import UserProfile from './profile/UserProfile';
import Trending from './Trending';
import CustomDashboards from './CustomDashboards';
import ContentCardSkeleton from './ContentCardSkeleton';
import TrendingCategories from './TrendingCategories';
import TrendingHashtags from './TrendingHashtags';
import SentimentAnalysis from './SentimentAnalysis';
import GlobalReach from './GlobalReach';
import YoutubeSummarizer from './YoutubeSummarizer';
import PlatformService from '../services/PlatformService';
import { Content } from '../types';

// Add this import at the top


import CreatorCards from './CreatorCards';
import CryptoTrends from './CryptoTrends';
import NewsTrends from './NewsTrends';
import TrendingMusic from './TrendingMusic';
import FollowingManager from './FollowingManager';
import RedditTrends from './RedditTrends';
import BlueskyTrends from './BlueskyTrends';
import HackerNewsTrends from './HackerNewsTrends';
import InlineMegaFilter, { MegaFilterState } from './InlineMegaFilter';
import TrendingFilter from './TrendingFilter';
import { useTrending } from '../contexts/TrendingContext';
import AIToolsDashboard from './AIToolsDashboard';
import StefnaAIChat from './StefnaAIChat';
import AIFeatureService from '../services/AIFeatureService';

interface DashboardProps {
  onSidebarToggle: () => void;
  selectedPlatform: string;
  selectedCategory: string;
  onAiChatOpen: () => void;
  onAuthOpen: () => void;
  onCategoryChange: (category: string) => void;
}



// In the Dashboard component, update the auth section:
const Dashboard: React.FC<DashboardProps> = ({ 
  onSidebarToggle, 
  selectedPlatform, 
  selectedCategory,
  onAiChatOpen,
  onAuthOpen,
  onCategoryChange
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { addTrends } = useTrending();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<{ type: 'hashtag' | 'category'; value: string } | null>(null);
  const [megaFilterState, setMegaFilterState] = useState<MegaFilterState>({
    platforms: [],
    contentTypes: [],
    hashtags: [],
    categories: [],
    searchQuery: '',
    sortBy: 'relevance'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const aiService = AIFeatureService.getInstance();
  const [quotaInfo, setQuotaInfo] = useState(aiService.getQuotaInfo());

  // Real-time quota updates
  useEffect(() => {
    const updateQuota = () => {
      setQuotaInfo(aiService.getQuotaInfo());
    };

    // Update quota every 5 seconds
    const interval = setInterval(updateQuota, 5000);
    
    // Also update when component mounts
    updateQuota();

    return () => clearInterval(interval);
  }, []);

  // Remove hasMore and page state since we're not using infinite scroll
  // const [hasMore, setHasMore] = useState(true);
  // const [page, setPage] = useState(1);



  const handleProfileClick = () => {
    if (user) {
      onCategoryChange('profile');
    } else {
      onAuthOpen();
    }
  };

  const handleUniversalRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh current content
      const data = await fetchContent(1);
      setContent(data);
      
      // Extract trending hashtags and categories from the content
      if (data.length > 0) {
        addTrends(data, selectedPlatform);
      }
    } catch (error) {
      console.error('Error refreshing content:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real data fetcher
  const fetchContent = useCallback(async (pageNum: number = 1): Promise<Content[]> => {
    try {
      const platforms = selectedPlatform === 'all' ? ['all'] : [selectedPlatform];
      console.log('Fetching content for platforms:', platforms);
      const content = await PlatformService.getTrendingContent(platforms, 12);
      console.log('Content received from PlatformService:', content);
      console.log('Content length:', content.length);
      console.log('Content details:', content.map(item => ({ id: item.id, title: item.title, platform: item.platform })));
      return content;
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  }, [selectedPlatform]);
  
  // Single useEffect for loading content - FIXED: Removed duplicate useEffects
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setIsLoading(true);
      
      try {
        const data = await fetchContent(1);
        setContent(data);
        
        // Extract trending hashtags and categories from the content
        if (data.length > 0) {
          addTrends(data, selectedPlatform);
        }
        
        // setPage(1); // Removed as per edit hint
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    // Add a small delay to prevent immediate "No content found" message
    const timer = setTimeout(() => {
      loadContent();
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedPlatform, selectedCategory, fetchContent]);

  // Auto-refresh content every 30 seconds
  useEffect(() => {
    const autoRefresh = async () => {
      const newContent = await fetchContent(1);
      setContent(newContent);
      
      // Extract trending data from new content
      if (newContent.length > 0) {
        addTrends(newContent, selectedPlatform);
      }
      
      // setPage(1); // Removed as per edit hint
    };

    const interval = setInterval(autoRefresh, 30000);
    return () => clearInterval(interval);
  }, [fetchContent, selectedPlatform, addTrends]);

  // Filter content based on current filter
  const filteredContent = useMemo(() => {
    if (!currentFilter) return content;
    
    return content.filter(item => {
      if (currentFilter.type === 'hashtag') {
        return item.hashtags?.some(tag => 
          tag.toLowerCase().includes(currentFilter.value.toLowerCase())
        );
      } else if (currentFilter.type === 'category') {
        return item.category?.toLowerCase().includes(currentFilter.value.toLowerCase());
      }
      return true;
    });
  }, [content, currentFilter]);

  // Load more content (infinite scroll)
  // const loadMore = useCallback(() => {
  //   if (loading || !hasMore) return;
    
  //   setLoading(true);
  //   setTimeout(async () => {
  //     const newContent = await fetchContent(page + 1);
  //     setContent(prev => [...prev, ...newContent]);
  //     setPage(prev => prev + 1);
  //     setLoading(false);
      
  //     if (page >= 5) setHasMore(false);
  //   }, 1000);
  // }, [loading, hasMore, page, fetchContent]);

  // Remove infinite scroll - it's causing the shaking issue
  // useEffect(() => {
  //   let ticking = false;
    
  //   const handleScroll = () => {
  //     if (!ticking) {
  //       requestAnimationFrame(() => {
  //         const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  //         const windowHeight = window.innerHeight;
  //         const documentHeight = document.documentElement.scrollHeight;
  //         
  //         // Check if we're near the bottom (within 500px)
  //         if (scrollTop + windowHeight >= documentHeight - 500 && !loading && hasMore) {
  //           loadMore();
  //         }
  //         ticking = false;
  //       });
  //       ticking = true;
  //     }
  //   };

  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, [loading, hasMore, loadMore]);

  // Skeleton shows based on 'isLoading', not 'loading'
  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <ContentCardSkeleton />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Render content grid with skeleton loading
  const renderContentGrid = () => {
    if (filteredContent.length === 0 && !loading && !isLoading) {
      return (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-black mb-3 font-['Figtree']">
            {currentFilter ? 'No filtered content found' : 'No trending content found'}
          </h3>
          <p className="text-gray-500 font-['Figtree'] mb-6 max-w-md mx-auto">
            {currentFilter 
              ? `No results found for "${currentFilter.value}". Try a different filter.`
              : 'We\'re currently gathering the latest trending content. Check back soon for fresh updates.'
            }
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentFilter(null);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-6 sm:p-8 lg:p-10">
        {filteredContent.map((item, index) => (
          <div
            key={item.id}
            className="transform transition-all duration-200 hover:scale-[1.02]"
          >
            <ContentCard content={item} viewMode="grid" />
          </div>
        ))}
      </div>
    );
  };

  // Render different components based on selected category
  // Update renderContent function:
  const renderContent = () => {
    console.log('renderContent called - loading:', loading, 'content length:', content.length);
    if (loading) {
      console.log('Showing loading spinner');
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-white">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    switch (selectedCategory) {
      case 'global-reach':
        return <GlobalReach />;
      case 'trending':
        return (
          <>
            {/* Header Section */}
            <div className="p-6 sm:p-8 lg:p-10 bg-white border-b border-gray-100">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-black mb-2">YouTube Trends</h1>
                <p className="text-gray-600">Discover trending videos and content from YouTube</p>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('dashboard.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-['Figtree']"
                />
              </div>
            </div>

            {/* Content Grid with Skeleton Loading */}
            {renderContentGrid()}

            {/* Load More - Removed to fix scrolling issues */}
            {/* {loading && content.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )} */}

            {/* No More Content */}
            {/* {!hasMore && content.length > 0 && ( // Removed as per edit hint */}
            {/*   <div className="text-center py-8"> // Removed as per edit hint */}
            {/*     <p className="text-gray-500 font-['Figtree']"> // Removed as per edit hint */}
            {/*       You've reached the end of trending content // Removed as per edit hint */}
            {/*     </p> // Removed as per edit hint */}
            {/*   </div> // Removed as per edit hint */}
            {/* )} // Removed as per edit hint */}

            {/* No Results - Removed duplicate, handled in renderContentGrid() */}
          </>
        );
      case 'trending-categories':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">Trending Categories</h1>
              <p className="text-gray-600">Explore content by popular categories</p>
            </div>
            <TrendingFilter 
              onFilterChange={setCurrentFilter}
              currentFilter={currentFilter}
              defaultTab="categories"
              mode="categories-only"
              onViewFilteredContent={() => onCategoryChange('trending')}
            />
          </div>
        );
      case 'trending-hashtags':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">Trending Hashtags</h1>
              <p className="text-gray-600">Discover popular hashtags across all platforms</p>
            </div>
            <TrendingFilter 
              onFilterChange={setCurrentFilter}
              currentFilter={currentFilter}
              defaultTab="hashtags"
              mode="hashtags-only"
              onViewFilteredContent={() => onCategoryChange('trending')}
            />
          </div>
        );
      case 'trending-creators':
        return <CreatorCards onAuthOpen={onAuthOpen} selectedPlatform={selectedPlatform} />;
      case 'sentiment-analysis':
        return <SentimentAnalysis />;
      case 'crypto-trends':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">Crypto Trends</h1>
              <p className="text-gray-600">Track cryptocurrency market trends and analytics</p>
            </div>
            <CryptoTrends onAuthOpen={onAuthOpen} />
          </div>
        );
      case 'news-trends':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">News Trends</h1>
              <p className="text-gray-600">Stay updated with trending news and current events</p>
            </div>
            <NewsTrends onAuthOpen={onAuthOpen} />
          </div>
        );
      case 'schedule':
        return <Schedule />;
      case 'settings':
        return <Settings />;
      case 'saved':
        return <UserProfile onAuthOpen={onAuthOpen} selectedCategory={selectedCategory} />;
      case 'monitoring':
        return <UserProfile onAuthOpen={onAuthOpen} selectedCategory={selectedCategory} />;
      case 'analytics':
        return <UserProfile onAuthOpen={onAuthOpen} selectedCategory={selectedCategory} />;
      case 'alerts':
        return <UserProfile onAuthOpen={onAuthOpen} selectedCategory={selectedCategory} />;
      case 'music-trends':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">Music Trends</h1>
              <p className="text-gray-600">Discover trending music and popular tracks</p>
            </div>
            <TrendingMusic onAuthOpen={onAuthOpen} />
          </div>
        );
      case 'following':
        return <FollowingManager />;
      case 'reddit-trends':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">Reddit Trends</h1>
              <p className="text-gray-600">Explore trending posts and discussions from Reddit</p>
            </div>
            <RedditTrends onAuthOpen={onAuthOpen} />
          </div>
        );
      case 'bluesky-trends':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">Bluesky Trends</h1>
              <p className="text-gray-600">Discover trending posts from the Bluesky social network</p>
            </div>
            <BlueskyTrends onAuthOpen={onAuthOpen} />
          </div>
        );
      case 'hackernews-trends':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">Hacker News Trends</h1>
              <p className="text-gray-600">Explore trending tech stories and discussions</p>
            </div>
            <HackerNewsTrends onAuthOpen={onAuthOpen} />
          </div>
        );
      case 'mega-filter':
        return (
          <div className="p-6 sm:p-8 lg:p-10 bg-white">
            <InlineMegaFilter
              onApplyFilters={setMegaFilterState}
              currentFilters={megaFilterState}
              onClearFilters={() => setMegaFilterState({
                platforms: [],
                contentTypes: [],
                hashtags: [],
                categories: [],
                searchQuery: '',
                sortBy: 'relevance'
              })}
            />
          </div>
        );
      
      // AI Tools Cases
      case 'youtube-summarizer':
        return <AIToolsDashboard toolId="youtube-summarizer" />;
      case 'content-generator':
        return <AIToolsDashboard toolId="content-generator" />;
      case 'caption-writer':
        return <AIToolsDashboard toolId="caption-writer" />;
      case 'tweet-creator':
        return <AIToolsDashboard toolId="tweet-creator" />;
      case 'sentiment-analyzer':
        return <AIToolsDashboard toolId="sentiment-analyzer" />;
      case 'hashtag-generator':
        return <AIToolsDashboard toolId="hashtag-generator" />;
      case 'ai-tools':
        return <AIToolsDashboard />;
      case 'stefna-ai-chat':
        return <StefnaAIChat onAuthOpen={onAuthOpen} />;

      default:
        // Default to trending cards instead of overview
        return (
          <>
            {/* Mobile Search */}
            <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('dashboard.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black font-['Figtree']"
                />
              </div>
            </div>

            {/* Content Grid with Skeleton Loading */}
            {renderContentGrid()}

            {/* Load More */}
            {loading && content.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}

            {/* No More Content */}
            {/* {!hasMore && content.length > 0 && ( // Removed as per edit hint */}
            {/*   <div className="text-center py-8"> // Removed as per edit hint */}
            {/*     <p className="text-gray-500 font-['Figtree']"> // Removed as per edit hint */}
            {/*       You've reached the end of trending content // Removed as per edit hint */}
            {/*     </p> // Removed as per edit hint */}
            {/*   </div> // Removed as per edit hint */}
            {/* )} // Removed as per edit hint */}

            {/* No Results */}
            {content.length === 0 && !loading && !isLoading && (
              <div className="text-center py-20">
                <h3 className="text-lg font-semibold text-black mb-2 font-['Figtree']">
                  No content found
                </h3>
                <p className="text-gray-500 font-['Figtree']">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </>
        );
    }
  };

  // Update header visibility condition:
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-4">
            <button
              onClick={onSidebarToggle}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        
        <div className="flex items-center gap-3">
          {/* AI Quota Display */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" onClick={() => {
            if (!quotaInfo.canUseFeature) {
              toast.error('Daily AI quota exceeded. Come back tomorrow or invite friends for more!');
            } else {
              toast.success(`AI Quota: ${quotaInfo.dailyUsed}/${quotaInfo.dailyLimit} uses remaining today`);
            }
          }}>
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="text-xs">
              <div className="font-medium text-black">AI Quota</div>
              <div className="text-gray-500">{quotaInfo.dailyUsed}/{quotaInfo.dailyLimit}</div>
            </div>
          </div>

          {/* Profile Button */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <span className="text-sm font-medium">
              {user ? (user.name || user.email) : 'Sign In'}
            </span>
          </button>
          
          {/* Logout Button - Only show when logged in */}
          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        {renderContent()}
      </main>

    </div>
  );
};


export default Dashboard;

