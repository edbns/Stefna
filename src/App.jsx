import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ContentCard from './components/ContentCard';
import AIChat from './components/AIChat';
import Auth from './components/Auth';
import { 
  FiRefreshCw, 
  FiTrendingUp, 
  FiAlertCircle, 
  FiMapPin, 
  FiBarChart,
  FiYoutube, 
  FiMusic,
  FiMessageCircle,
  FiUsers,
  FiGlobe
} from 'react-icons/fi';
import { getCachedLocation } from './utils/locationDetection';

const queryClient = new QueryClient();

function AppContent() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('trending');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['youtube']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('worldwide');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  // Check for existing user on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  }, [inView, hasMore, isLoading]);

  // Close sidebar when clicking outside on desktop
  const handleMainContentClick = () => {
    if (sidebarOpen && window.innerWidth >= 1024) {
      setSidebarOpen(false);
    }
  };

  // Fetch trending content
  const { data: trendingData, isLoading, error, refetch } = useQuery(
    ['trending', selectedPlatforms, selectedRegion, page],
    async () => {
      const results = [];
      
      if (selectedPlatforms.includes('youtube')) {
        try {
          const apiRegion = selectedRegion === 'worldwide' ? 'US' : selectedRegion;
          const response = await fetch(`/api/youtube-trending?region=${apiRegion}&maxResults=20`);
          const data = await response.json();
          if (data.success) {
            results.push(...data.data);
          }
        } catch (error) {
          console.error('YouTube API error:', error);
        }
      }

      // Generate mock data for infinite scroll demo
      if (page > 1) {
        const mockData = Array.from({ length: 10 }, (_, i) => ({
          id: `mock-${page}-${i}`,
          title: `Mock Trending Video ${page}-${i}`,
          channelTitle: 'Mock Channel',
          publishedAt: new Date().toISOString(),
          viewCount: Math.floor(Math.random() * 1000000),
          likeCount: Math.floor(Math.random() * 100000),
          commentCount: Math.floor(Math.random() * 10000),
          thumbnail: 'https://via.placeholder.com/320x180/353437/FFFFFF?text=Mock+Video',
          platform: 'youtube',
          tags: ['mock', 'demo', 'trending'],
          duration: 'PT10M30S'
        }));
        results.push(...mockData);
      }

      if (page >= 3) {
        setHasMore(false);
      }

      return results;
    },
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
      enabled: !isDetectingLocation,
    }
  );

  // Filter content based on search term
  const filteredContent = trendingData?.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.channelTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleShare = (shareData) => {
    console.log('Shared:', shareData);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to SocialSpy</h1>
              <p className="text-gray-300 mb-4">Your comprehensive social media intelligence platform</p>
              {!user && (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Get Started
                </button>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Views</p>
                    <p className="text-2xl font-bold text-white">
                      {filteredContent.reduce((sum, item) => sum + (item.viewCount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <FiTrendingUp className="text-gray-400" size={24} />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Platforms</p>
                    <p className="text-2xl font-bold text-white">{selectedPlatforms.length}</p>
                  </div>
                  <FiYoutube className="text-gray-400" size={24} />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Region</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedRegion === 'worldwide' ? '🌍' : `🇺🇸`}
                    </p>
                  </div>
                  <FiGlobe className="text-gray-400" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">AI Chat</p>
                    <p className="text-2xl font-bold text-white">Ready</p>
                  </div>
                  <FiMessageCircle className="text-gray-400" size={24} />
                </div>
              </div>
            </div>
            
            {/* Data Collection Overview */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Data Collection Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">📊</div>
                  <p className="text-sm text-gray-400">Analytics</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">📈</div>
                  <p className="text-sm text-gray-400">Trends</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">👥</div>
                  <p className="text-sm text-gray-400">Audience</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">🎯</div>
                  <p className="text-sm text-gray-400">Insights</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'trending':
      case 'youtube':
      case 'tiktok':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {activeSection === 'trending' ? 'Trending' : 
                   activeSection === 'youtube' ? 'YouTube' :
                   'TikTok'}
                </h1>
                <p className="text-gray-400">
                  {selectedRegion === 'worldwide' ? (
                    <span>Global <span className="text-gray-300">Worldwide</span></span>
                  ) : (
                    <span>Location: <span className="text-gray-300">United States</span></span>
                  )} • {filteredContent.length} videos
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setAiChatOpen(true)}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <FiMessageCircle size={16} />
                  <span>AI Chat</span>
                </button>
                
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  <FiRefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-700 rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <FiAlertCircle className="text-red-400" />
                  <p className="text-red-300">
                    Failed to load trending content. Please check your API configuration.
                  </p>
                </div>
              </div>
            )}

            {isLoading && page === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 animate-pulse">
                    <div className="bg-gray-700 h-32 rounded-lg mb-4"></div>
                    <div className="bg-gray-700 h-4 rounded mb-2"></div>
                    <div className="bg-gray-700 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContent.map((item, index) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onShare={handleShare}
                    index={index}
                  />
                ))}
              </div>
            )}

            {/* Infinite Scroll Loader */}
            {hasMore && (
              <div ref={ref} className="infinite-scroll-loader">
                {isLoading && page > 1 ? (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="animate-spin w-4 h-4 border border-gray-600 border-t-transparent rounded-full"></div>
                    <span>Loading more...</span>
                  </div>
                ) : (
                  <div className="text-gray-400">Scroll for more content</div>
                )}
              </div>
            )}

            {!hasMore && filteredContent.length > 0 && (
              <div className="text-center text-gray-400 py-8">
                You've reached the end of trending content
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-gray-400">Comprehensive data insights and metrics</p>
              </div>
              <button
                onClick={() => setAiChatOpen(true)}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <FiMessageCircle size={16} />
                <span>AI Insights</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Engagement Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Views</span>
                    <span className="text-white font-semibold">2.4M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Likes</span>
                    <span className="text-white font-semibold">156K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Comments</span>
                    <span className="text-white font-semibold">23K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Shares</span>
                    <span className="text-white font-semibold">8.9K</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Platform Distribution</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">YouTube</span>
                    <span className="text-white font-semibold">65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">TikTok</span>
                    <span className="text-white font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Twitter</span>
                    <span className="text-white font-semibold">7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Instagram</span>
                    <span className="text-white font-semibold">3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Account Settings</h2>
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full flex items-center justify-center">
                      <FiUsers className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.email}</p>
                      <p className="text-gray-400 text-sm">Logged in</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400">Sign in to access advanced features</p>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Data Sources</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">YouTube Data API</span>
                  <span className="text-green-400">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">TikTok API</span>
                  <span className="text-yellow-400">Coming Soon</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Twitter API</span>
                  <span className="text-yellow-400">Coming Soon</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Privacy & Data</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Data Collection</span>
                  <span className="text-green-400">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Analytics</span>
                  <span className="text-green-400">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">AI Processing</span>
                  <span className="text-green-400">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Section Not Found</h2>
            <p className="text-gray-400">The requested section is not available.</p>
          </div>
        );
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-primary"
      onClick={handleMainContentClick}
    >
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        selectedPlatforms={selectedPlatforms}
        setSelectedPlatforms={setSelectedPlatforms}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
      />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'lg:ml-20'}`}>
        <Header 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          user={user}
          onAuthClick={() => setAuthOpen(true)}
        />
        
        <main className="p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* AI Chat */}
      <AIChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
      
      {/* Auth Modal */}
      <Auth isOpen={authOpen} onClose={() => setAuthOpen(false)} onLogin={handleLogin} />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#353437',
            color: '#FFFFFF',
            border: '1px solid #4F4E52',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
} 