import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Search, LogIn, LogOut, User } from 'lucide-react';
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
import FloatingFilter from './FloatingFilter';

import CreatorCards from './CreatorCards';
import CryptoTrends from './CryptoTrends';
import NewsTrends from './NewsTrends';
import TrendingMusic from './TrendingMusic';
import FollowingManager from './FollowingManager';
import RedditTrends from './RedditTrends';

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
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
        // setPage(1); // Removed as per edit hint
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    loadContent();
  }, [selectedPlatform, selectedCategory, fetchContent]);

  // Auto-refresh content every 30 seconds
  useEffect(() => {
    const autoRefresh = async () => {
      const newContent = await fetchContent(1);
      setContent(newContent);
      // setPage(1); // Removed as per edit hint
    };

    const interval = setInterval(autoRefresh, 30000);
    return () => clearInterval(interval);
  }, [fetchContent]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-6 sm:p-8 lg:p-10">
        {Array.from({ length: 8 }).map((_, index) => (
          <ContentCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Render content grid with skeleton loading
  const renderContentGrid = () => {
    if (content.length === 0 && !loading && !isLoading) {
      return (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-black mb-2">No content found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-6 sm:p-8 lg:p-10">
        {content.map((item, index) => (
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
    if (loading && content.length === 0) {
      console.log('Showing loading spinner');
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    switch (selectedCategory) {
      case 'trending':
        return (
          <>
            {/* Add FloatingFilter component here */}
            <FloatingFilter
              onSearch={(query: string) => setSearchQuery(query)}
              onFilterChange={() => {}}
              data={content}
            />

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
      case 'trending-categories':
        return <TrendingCategories onAuthOpen={onAuthOpen} />;
      case 'trending-hashtags':
        return <TrendingHashtags onAuthOpen={onAuthOpen} />;
      case 'trending-creators':
        return <CreatorCards onAuthOpen={onAuthOpen} selectedPlatform={selectedPlatform} />;
      case 'youtube-summarizer':
        return <YoutubeSummarizer />;
      case 'sentiment-analysis':
        return <SentimentAnalysis />;
      case 'crypto-trends':
        return <CryptoTrends onAuthOpen={onAuthOpen} />;
      case 'news-trends':
        return <NewsTrends onAuthOpen={onAuthOpen} />;
      case 'global-reach':
        return <GlobalReach />;
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
        return <TrendingMusic />;
      case 'following':
        return <FollowingManager />;
      case 'reddit-trends':
        return <RedditTrends />;
      default:
        // Default to trending cards instead of overview
        return (
          <>
            {/* Add FloatingFilter component here */}
            <FloatingFilter
              onSearch={(query: string) => setSearchQuery(query)}
              onFilterChange={() => {}}
              data={content}
            />

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
          <h1 className="text-xl font-semibold text-black font-['Figtree']">
            {selectedCategory === 'trending' ? 'YouTube Trends' : 
             selectedCategory === 'crypto-trends' ? 'Crypto Trends' :
             selectedCategory === 'news-trends' ? 'News Trends' :
             selectedCategory === 'music-trends' ? 'Music Trends' :
             selectedCategory === 'trending-hashtags' ? 'Trending Hashtags' :
             selectedCategory === 'trending-categories' ? 'Trending Categories' :
             selectedCategory === 'youtube-summarizer' ? 'YouTube Summarizer' :
             selectedCategory === 'sentiment-analysis' ? 'Sentiment Analysis' :
             selectedCategory === 'global-reach' ? 'Global Reach' :
             selectedCategory === 'schedule' ? 'Schedule' :
             selectedCategory === 'settings' ? 'Settings' :
             selectedCategory === 'saved' ? 'Saved Content' :
             selectedCategory === 'monitoring' ? 'Monitoring' :
             selectedCategory === 'analytics' ? 'Analytics' :
             selectedCategory === 'alerts' ? 'Alerts' :
             selectedCategory === 'reddit-trends' ? 'Reddit Trends' :
             selectedCategory === 'following' ? 'Following' : 'Dashboard'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
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
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {renderContent()}
      </main>
    </div>
  );
};


export default Dashboard;

