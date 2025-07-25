import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ContentCard from './components/ContentCard';
import { FiRefreshCw, FiTrendingUp, FiAlertCircle, FiMapPin } from 'react-icons/fi';
import { getCachedLocation } from './utils/locationDetection';
import { FiYoutube, FiMusic } from 'react-icons/fi';

const queryClient = new QueryClient();

function AppContent() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('trending');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['youtube']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState(null);

  // Auto-detect user location on first load
  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsDetectingLocation(true);
        const location = await getCachedLocation();
        if (location) {
          setSelectedRegion(location);
          setDetectedCountry(location);
          console.log('Detected user location:', location);
        }
      } catch (error) {
        console.error('Location detection failed:', error);
        // Fallback to US if detection fails
        setSelectedRegion('US');
      } finally {
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

  // Close sidebar when clicking outside on desktop
  const handleMainContentClick = () => {
    if (sidebarOpen && window.innerWidth >= 1024) { // Only on desktop (lg breakpoint)
      setSidebarOpen(false);
    }
  };

  // Fetch trending content
  const { data: trendingData, isLoading, error, refetch } = useQuery(
    ['trending', selectedPlatforms, selectedRegion],
    async () => {
      const results = [];
      
      if (selectedPlatforms.includes('youtube')) {
        try {
          // Use 'US' for API call if worldwide is selected
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

      // Add other platforms here when APIs are available
      // TikTok, Twitter, Instagram, etc.

      return results;
    },
    {
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
      enabled: !isDetectingLocation, // Don't fetch until location is detected
    }
  );

  // Filter content based on search term
  const filteredContent = trendingData?.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.channelTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleShare = (shareData) => {
    // Show toast notification
    console.log('Shared:', shareData);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Location Detection Status */}
            {detectedCountry && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <FiMapPin className="text-blue-600 dark:text-blue-400" size={16} />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Location: <strong>{t(`countries.${detectedCountry}`)}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sidebar.trending')}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {filteredContent.length}
                    </p>
                  </div>
                  <FiTrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sidebar.platforms')}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedPlatforms.length}
                    </p>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-2xl">⚡</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('sidebar.region')}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {t(`countries.${selectedRegion}`)}
                    </p>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-2xl">🌐</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('sidebar.dashboard')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredContent.length} {t('post.views')} {selectedPlatforms.length} {t('sidebar.platforms')}
                {detectedCountry && (
                  <span className="block mt-2 text-blue-600 dark:text-blue-400">
                    Region: {t(`countries.${detectedCountry}`)}
                  </span>
                )}
              </p>
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeSection === 'trending' ? t('sidebar.trending') : 
                   activeSection === 'youtube' ? t('sidebar.youtube') :
                   t('sidebar.tiktok')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedRegion === 'worldwide' ? (
                    <span>Global <span className="text-blue-600 dark:text-blue-400">{t('countries.worldwide')}</span></span>
                  ) : (
                    <span>Location: <span className="text-blue-600 dark:text-blue-400">{t(`countries.${selectedRegion}`)}</span></span>
                  )} • {filteredContent.length} {t('post.views')}
                </p>
              </div>
              
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Location Detection Status */}
            {isDetectingLocation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-blue-700 dark:text-blue-300">Detecting your location...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FiAlertCircle className="text-red-600 dark:text-red-400" />
                  <p className="text-red-700 dark:text-red-400">
                    Failed to load trending content. Please check your API configuration.
                  </p>
                </div>
              </div>
            )}

            {isLoading || isDetectingLocation ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse border border-gray-200 dark:border-gray-700">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {filteredContent.map((item) => (
                    <ContentCard
                      key={item.id}
                      content={item}
                      onShare={handleShare}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {!isLoading && !isDetectingLocation && filteredContent.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('sidebar.search')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </div>
        );
        
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('sidebar.settings')}</h1>
            
            {/* Location Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Location Detection</h2>
              <div className="space-y-3">
                <p className="text-gray-600 dark:text-gray-400">
                  SpyDash automatically detects your location to show trending content relevant to your region.
                </p>
                {detectedCountry && (
                  <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FiMapPin className="text-blue-600 dark:text-blue-400" size={16} />
                    <span className="text-blue-700 dark:text-blue-300">
                      Detected Location: <strong>{t(`countries.${detectedCountry}`)}</strong>
                    </span>
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How it works:</h4>
                  <ul className="space-y-1">
                    <li>Browser location (with your permission)</li>
                    <li>IP-based detection as backup</li>
                    <li>Timezone analysis for accuracy</li>
                    <li>Cached for 24 hours for performance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Data Sources</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                SpyDash aggregates trending content from multiple platforms using official APIs and AI-powered insights.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-2">
                    <FiYoutube className="text-red-600 text-2xl" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">YouTube</h3>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Official YouTube Data API v3 for trending videos, views, and metadata.</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Insights</h3>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">OpenRouter AI for intelligent content summaries and trend analysis.</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 opacity-75">
                  <div className="flex items-center gap-3 mb-2">
                    <FiMusic className="text-black dark:text-white text-2xl" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">TikTok</h3>
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">TikTok trending content and viral videos integration.</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 opacity-75">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">𝕏</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Twitter</h3>
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Twitter trending topics and viral tweets analysis.</p>
                </div>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Privacy & Data</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">🛡</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">No Personal Data Collection</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">We only detect your location for content relevance. No personal information is stored.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">🌐</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Public Data Only</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">All content shown is publicly available trending data from official platform APIs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">⚡</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Real-Time Updates</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Content refreshes every 5 minutes to show the latest trending topics and videos.</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
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
        className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-16'} ${sidebarOpen ? 'lg:cursor-pointer' : ''} relative`}
        onClick={handleMainContentClick}
      >
        {/* Subtle overlay when sidebar is open on desktop */}
        {sidebarOpen && (
          <div className="hidden lg:block absolute inset-0 bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5 z-10 pointer-events-none" />
        )}
        
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 relative z-20">
          {renderContent()}
        </main>
      </div>
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