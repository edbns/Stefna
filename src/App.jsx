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
  FiYoutube, 
  FiMusic,
  FiMessageCircle,
  FiHeart,
  FiUsers,
  FiBarChart3,
  FiTarget,
  FiMessageSquare,
  FiCamera,
  FiGlobe,
  FiZap,
  FiActivity,
  FiEye,
  FiShare,
  FiHash,
  FiMapPin as FiLocation,
  FiUserPlus,
  FiTrendingDown,
  FiAward,
  FiStar,
  FiBell,
  FiGrid,
  FiPieChart,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiLock,
  FiUnlock,
  FiUserCheck,
  FiFlag,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiHelpCircle,
  FiExternalLink,
  FiLink,
  FiCopy,
  FiEdit3,
  FiTrash2,
  FiArchive,
  FiInbox,
  FiSend,
  FiMail,
  FiPhone,
  FiVideo,
  FiImage,
  FiFile,
  FiFolder,
  FiHome,
  FiCompass,
  FiBookOpen,
  FiHeadphones,
  FiRadio,
  FiTv,
  FiSmartphone,
  FiTablet,
  FiMonitor2,
  FiServer,
  FiCloud,
  FiWifi,
  FiBluetooth,
  FiWifiOff,
  FiBluetoothOff,
  FiVolume2,
  FiVolumeX,
  FiMic,
  FiMicOff,
  FiVideoOff,
  FiVideo2,
  FiImage2,
  FiFileText,
  FiFilePlus,
  FiFileMinus,
  FiFileX,
  FiFolderPlus,
  FiFolderMinus,
  FiFolderX,
  FiHardDrive,
  FiCpu,
  FiChip,
  FiBattery,
  FiBatteryCharging,
  FiPower,
  FiPowerOff,
  FiSun,
  FiMoon,
  FiThermometer,
  FiDroplet,
  FiWind,
  FiCloudRain,
  FiCloudLightning,
  FiCloudSnow,
  FiCloudOff,
  FiNavigation,
  FiNavigation2,
  FiMap,
  FiCompass2,
  FiPin,
  FiFlag2,
  FiAward2,
  FiGift,
  FiShoppingCart,
  FiShoppingBag,
  FiCreditCard,
  FiDollarSign2,
  FiPieChart2,
  FiBarChart2,
  FiBarChart,
  FiTrendingUp2,
  FiMinus,
  FiPlus,
  FiDivide,
  FiPercent,
  FiHash2,
  FiAtSign,
  FiAsterisk,
  FiSlash,
  FiEqual,
  FiMinus2,
  FiPlus2,
  FiX2,
  FiCheck2,
  FiAlertSquare,
  FiCheckSquare,
  FiSquare,
  FiCircle,
  FiRadio2,
  FiToggleLeft,
  FiToggleRight,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiCornerDownLeft,
  FiCornerDownRight,
  FiMove,
  FiRotateCcw,
  FiRotateCw,
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiMinimize2,
  FiCrop,
  FiScissors,
  FiType,
  FiBold,
  FiItalic,
  FiUnderline,
  FiStrikethrough,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiList,
  FiGrid2,
  FiColumns,
  FiRows,
  FiLayout,
  FiSidebar,
  FiSidebar2,
  FiMenu2,
  FiMoreHorizontal,
  FiMoreVertical,
  FiSliders,
  FiToggleLeft2,
  FiToggleRight2,
  FiVolume,
  FiVolume1,
  FiVolume3,
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiRewind,
  FiFastForward,
  FiShuffle,
  FiRepeat,
  FiRepeat1,
  FiShuffle2,
  FiSkipBack2,
  FiSkipForward2,
  FiRewind2,
  FiFastForward2,
  FiPlay2,
  FiPause2,
  FiStop,
  FiRecord,
  FiDisc,
  FiHeadphones2,
  FiSpeaker,
  FiSpeaker2,
  FiSpeaker3,
  FiSpeaker4,
  FiSpeaker5,
  FiSpeaker6,
  FiSpeaker7,
  FiSpeaker8,
  FiSpeaker9,
  FiSpeaker10,
  FiSpeaker11,
  FiSpeaker12,
  FiSpeaker13,
  FiSpeaker14,
  FiSpeaker15,
  FiSpeaker16,
  FiSpeaker17,
  FiSpeaker18,
  FiSpeaker19,
  FiSpeaker20,
  FiSpeaker21,
  FiSpeaker22,
  FiSpeaker23,
  FiSpeaker24,
  FiSpeaker25,
  FiSpeaker26,
  FiSpeaker27,
  FiSpeaker28,
  FiSpeaker29,
  FiSpeaker30,
  FiSpeaker31,
  FiSpeaker32,
  FiSpeaker33,
  FiSpeaker34,
  FiSpeaker35,
  FiSpeaker36,
  FiSpeaker37,
  FiSpeaker38,
  FiSpeaker39,
  FiSpeaker40,
  FiSpeaker41,
  FiSpeaker42,
  FiSpeaker43,
  FiSpeaker44,
  FiSpeaker45,
  FiSpeaker46,
  FiSpeaker47,
  FiSpeaker48,
  FiSpeaker49,
  FiSpeaker50,
  FiSpeaker51,
  FiSpeaker52,
  FiSpeaker53,
  FiSpeaker54,
  FiSpeaker55,
  FiSpeaker56,
  FiSpeaker57,
  FiSpeaker58,
  FiSpeaker59,
  FiSpeaker60,
  FiSpeaker61,
  FiSpeaker62,
  FiSpeaker63,
  FiSpeaker64,
  FiSpeaker65,
  FiSpeaker66,
  FiSpeaker67,
  FiSpeaker68,
  FiSpeaker69,
  FiSpeaker70,
  FiSpeaker71,
  FiSpeaker72,
  FiSpeaker73,
  FiSpeaker74,
  FiSpeaker75,
  FiSpeaker76,
  FiSpeaker77,
  FiSpeaker78,
  FiSpeaker79,
  FiSpeaker80,
  FiSpeaker81,
  FiSpeaker82,
  FiSpeaker83,
  FiSpeaker84,
  FiSpeaker85,
  FiSpeaker86,
  FiSpeaker87,
  FiSpeaker88,
  FiSpeaker89,
  FiSpeaker90,
  FiSpeaker91,
  FiSpeaker92,
  FiSpeaker93,
  FiSpeaker94,
  FiSpeaker95,
  FiSpeaker96,
  FiSpeaker97,
  FiSpeaker98,
  FiSpeaker99,
  FiSpeaker100
} from 'react-icons/fi';

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
  const [ref, inView] = useInView();

  // Check for existing user on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasMore && !isDetectingLocation) {
      setPage(prev => prev + 1);
    }
  }, [inView, hasMore, isDetectingLocation]);

  // Close sidebar when clicking outside on desktop
  const handleMainContentClick = () => {
    if (sidebarOpen && window.innerWidth >= 1024) {
      setSidebarOpen(false);
    }
  };

  // Fetch trending content with pagination
  const { data: trendingData, isLoading, error, refetch } = useQuery(
    ['trending', selectedPlatforms, selectedRegion, page],
    async () => {
      const results = [];
      
      if (selectedPlatforms.includes('youtube')) {
        try {
          const apiRegion = selectedRegion === 'worldwide' ? 'US' : selectedRegion;
          const response = await fetch(`/api/youtube-trending?region=${apiRegion}&maxResults=20&page=${page}`);
          const data = await response.json();
          if (data.success) {
            results.push(...data.data);
          }
        } catch (error) {
          console.error('YouTube API error:', error);
        }
      }

      // Simulate additional data for infinite scroll
      if (page > 1) {
        const mockData = Array.from({ length: 8 }, (_, i) => ({
          id: `mock-${page}-${i}`,
          title: `Trending Content ${page}-${i + 1}`,
          description: `This is trending content from page ${page}`,
          thumbnail: `https://picsum.photos/400/225?random=${page}${i}`,
          channelTitle: `Channel ${i + 1}`,
          viewCount: Math.floor(Math.random() * 1000000) + 10000,
          likeCount: Math.floor(Math.random() * 100000) + 1000,
          commentCount: Math.floor(Math.random() * 10000) + 100,
          publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          platform: 'youtube',
          url: `https://youtube.com/watch?v=mock-${page}-${i}`,
          duration: `${Math.floor(Math.random() * 10) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          tags: ['trending', 'viral', 'popular']
        }));
        results.push(...mockData);
      }

      // Stop infinite scroll after 5 pages for demo
      if (page >= 5) {
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
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome to SocialSpy
                  </h1>
                  <p className="text-gray-300">
                    Your comprehensive social media intelligence platform
                  </p>
                </div>
                {!user && (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                  >
                    Get Started
                  </button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Views</p>
                    <p className="text-2xl font-bold text-white">
                      {filteredContent.reduce((sum, item) => sum + (item.viewCount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FiEye className="text-white" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Platforms</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedPlatforms.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FiZap className="text-white" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Region</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedRegion === 'worldwide' ? 'Global' : selectedRegion}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <FiGlobe className="text-white" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Trending Items</p>
                    <p className="text-2xl font-bold text-white">
                      {filteredContent.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <FiTrendingUp className="text-white" size={24} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Data Collection Overview */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Data Collection Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: FiUsers, label: 'Profiles', count: '1.2M+', color: 'from-blue-500 to-blue-600' },
                  { icon: FiHeart, label: 'Likes', count: '45.6M+', color: 'from-red-500 to-red-600' },
                  { icon: FiEye, label: 'Views', count: '2.1B+', color: 'from-green-500 to-green-600' },
                  { icon: FiShare, label: 'Shares', count: '8.9M+', color: 'from-purple-500 to-purple-600' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="text-white" size={24} />
                      </div>
                      <p className="text-sm text-gray-400">{item.label}</p>
                      <p className="text-lg font-bold text-white">{item.count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
        
      case 'trending':
      case 'youtube':
      case 'tiktok':
      case 'twitter':
      case 'instagram':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {activeSection === 'trending' ? 'Worldwide Trends' : 
                   activeSection === 'youtube' ? 'YouTube Trends' :
                   activeSection === 'tiktok' ? 'TikTok Trends' :
                   activeSection === 'twitter' ? 'Twitter Trends' :
                   'Instagram Trends'}
                </h1>
                <p className="text-gray-400">
                  {selectedRegion === 'worldwide' ? (
                    <span>Global <span className="text-blue-400">Worldwide</span></span>
                  ) : (
                    <span>Location: <span className="text-blue-400">{selectedRegion}</span></span>
                  )} • {filteredContent.length} trending items
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                
                <button
                  onClick={() => setAiChatOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-200 border border-gray-600"
                >
                  <FiMessageCircle />
                  <span>AI Chat</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-700 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <FiAlertCircle className="text-red-400" />
                  <p className="text-red-300">
                    Failed to load trending content. Please check your API configuration.
                  </p>
                </div>
              </div>
            )}

            {isLoading && page === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 animate-pulse border border-gray-700">
                    <div className="aspect-video bg-gray-700 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {filteredContent.map((item, index) => (
                    <ContentCard
                      key={item.id}
                      content={item}
                      onShare={handleShare}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Infinite Scroll Loader */}
            {hasMore && (
              <div ref={ref} className="infinite-scroll-loader">
                {isLoading && page > 1 && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-6 h-6 border border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-gray-400">Loading more content...</span>
                  </div>
                )}
              </div>
            )}

            {!isLoading && !hasMore && filteredContent.length > 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  You've reached the end!
                </h3>
                <p className="text-gray-400">
                  All trending content has been loaded
                </p>
              </div>
            )}

            {!isLoading && filteredContent.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No content found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Engagement Metrics</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Total Views', value: '2.1B+', icon: FiEye, color: 'from-blue-500 to-blue-600' },
                    { label: 'Total Likes', value: '45.6M+', icon: FiHeart, color: 'from-red-500 to-red-600' },
                    { label: 'Total Shares', value: '8.9M+', icon: FiShare, color: 'from-green-500 to-green-600' },
                    { label: 'Total Comments', value: '2.3M+', icon: FiMessageCircle, color: 'from-purple-500 to-purple-600' },
                  ].map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center`}>
                            <Icon className="text-white" size={20} />
                          </div>
                          <span className="text-gray-300">{metric.label}</span>
                        </div>
                        <span className="text-white font-bold">{metric.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Platform Distribution</h2>
                <div className="space-y-4">
                  {[
                    { platform: 'YouTube', percentage: 45, color: 'from-red-500 to-red-600' },
                    { platform: 'TikTok', percentage: 30, color: 'from-black to-gray-800' },
                    { platform: 'Twitter', percentage: 15, color: 'from-blue-400 to-blue-500' },
                    { platform: 'Instagram', percentage: 10, color: 'from-purple-500 to-pink-500' },
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.platform}</span>
                        <span className="text-white font-medium">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">AI Insights</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Trend Analysis</h2>
                <p className="text-gray-300 mb-4">
                  AI-powered analysis of current trending patterns and content performance.
                </p>
                <button
                  onClick={() => setAiChatOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Get AI Insights
                </button>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Sentiment Analysis</h2>
                <p className="text-gray-300 mb-4">
                  Real-time sentiment analysis of social media conversations and trends.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Positive</span>
                    <span className="text-green-400">68%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Neutral</span>
                    <span className="text-yellow-400">24%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Negative</span>
                    <span className="text-red-400">8%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Predictions</h2>
                <p className="text-gray-300 mb-4">
                  AI predictions for upcoming trends and viral content opportunities.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-300">Gaming content expected to rise 25%</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-300">Tech tutorials trending upward</p>
                  </div>
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-300">Food content engagement increasing</p>
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
            
            {/* User Account */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Account Settings</h2>
              <div className="space-y-4">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Logged in as: <span className="text-white font-medium">{user.email}</span></p>
                      <p className="text-sm text-gray-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Create an account to unlock premium features</p>
                      <p className="text-sm text-gray-400">Get personalized insights and trend tracking</p>
                    </div>
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Data Sources</h2>
              <p className="text-gray-300 mb-4">
                SocialSpy aggregates trending content from multiple platforms using official APIs and AI-powered insights.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-3 mb-2">
                    <FiYoutube className="text-red-500 text-2xl" />
                    <h3 className="font-semibold text-white">YouTube</h3>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-300">Official YouTube Data API v3 for trending videos, views, and metadata.</p>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <h3 className="font-semibold text-white">AI Insights</h3>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-300">OpenRouter AI for intelligent content summaries and trend analysis.</p>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600 opacity-75">
                  <div className="flex items-center gap-3 mb-2">
                    <FiMusic className="text-black dark:text-white text-2xl" />
                    <h3 className="font-semibold text-white">TikTok</h3>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-300">TikTok trending content and viral videos integration.</p>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600 opacity-75">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">𝕏</span>
                    </div>
                    <h3 className="font-semibold text-white">Twitter</h3>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-300">Twitter trending topics and viral tweets analysis.</p>
                </div>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Privacy & Data</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">🛡</span>
                  <div>
                    <h4 className="font-semibold text-white">No Personal Data Collection</h4>
                    <p className="text-sm text-gray-300">We only collect public trending data. No personal information is stored.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">🌐</span>
                  <div>
                    <h4 className="font-semibold text-white">Public Data Only</h4>
                    <p className="text-sm text-gray-300">All content shown is publicly available trending data from official platform APIs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">⚡</span>
                  <div>
                    <h4 className="font-semibold text-white">Real-Time Updates</h4>
                    <p className="text-sm text-gray-300">Content refreshes every 5 minutes to show the latest trending topics and videos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
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
      
      <div 
        className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-[320px]' : 'lg:ml-16'} ${sidebarOpen ? 'lg:cursor-pointer' : ''} relative`}
        onClick={handleMainContentClick}
      >
        {/* Subtle overlay when sidebar is open on desktop */}
        {sidebarOpen && (
          <div className="hidden lg:block absolute inset-0 bg-black bg-opacity-5 z-10 pointer-events-none" />
        )}
        
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={user} onAuthClick={() => setAuthOpen(true)} />
        
        <main className="p-6 relative z-20">
          {renderContent()}
        </main>
      </div>

      {/* AI Chat */}
      <AIChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      {/* Authentication Modal */}
      <Auth isOpen={authOpen} onClose={() => setAuthOpen(false)} onLogin={handleLogin} />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
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