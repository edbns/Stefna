import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiMonitor,
  FiSearch,
  FiLayers,
  FiTool,
  FiZap,
  FiGlobe,
  FiUsers,
  FiClock,
  FiShield,
  FiDollarSign,
  FiSettings,
  FiEdit,
  FiMenu,
  FiX,
  FiTrendingUp,
  FiYoutube,
  FiMusic,
  FiMessageCircle,
  FiHeart,
  FiEye,
  FiBarChart3,
  FiDatabase,
  FiActivity,
  FiTarget,
  FiAward,
  FiBookmark,
  FiUserCheck,
  FiGlobe2,
  FiHash,
  FiStar,
  FiBell,
  FiGrid,
  FiPieChart,
  FiMapPin,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiShare,
  FiLock,
  FiUnlock,
  FiUserPlus,
  FiUserMinus,
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
  FiCamera,
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
  FiLocation,
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
  FiTrendingDown,
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
  FiAlertCircle,
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
  FiSpeaker100,
  FiBriefcase,
  FiMessageSquare
} from 'react-icons/fi';

const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  activeSection, 
  setActiveSection,
  selectedPlatforms,
  setSelectedPlatforms,
  searchTerm,
  setSearchTerm,
  selectedRegion,
  setSelectedRegion
}) => {
  const { t } = useTranslation();

  const sections = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: FiMonitor },
    { id: 'trending', label: t('sidebar.trending'), icon: FiTrendingUp },
    { id: 'youtube', label: t('sidebar.youtube'), icon: FiYoutube },
    { id: 'tiktok', label: t('sidebar.tiktok'), icon: FiMusic },
    { id: 'twitter', label: 'Twitter', icon: FiMessageCircle },
    { id: 'instagram', label: 'Instagram', icon: FiHeart },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart3 },
    { id: 'insights', label: 'Insights', icon: FiTarget },
    { id: 'settings', label: t('sidebar.settings'), icon: FiSettings },
  ];

  const dataCollectionTools = [
    { id: 'profiles', label: 'Profiles', icon: FiUsers, description: 'Collect public profile data' },
    { id: 'followers', label: 'Followers', icon: FiUserPlus, description: 'Track follower analytics' },
    { id: 'likes', label: 'Likes', icon: FiHeart, description: 'Monitor engagement metrics' },
    { id: 'trends', label: 'Trends', icon: FiTrendingUp, description: 'Analyze trending topics' },
    { id: 'shorts', label: 'Shorts', icon: FiVideo, description: 'Short-form content data' },
    { id: 'comments', label: 'Comments', icon: FiMessageCircle, description: 'Comment sentiment analysis' },
    { id: 'views', label: 'Views', icon: FiEye, description: 'View count tracking' },
    { id: 'shares', label: 'Shares', icon: FiShare, description: 'Share analytics' },
    { id: 'hashtags', label: 'Hashtags', icon: FiHash, description: 'Hashtag performance' },
    { id: 'locations', label: 'Locations', icon: FiMapPin, description: 'Geographic data' },
    { id: 'demographics', label: 'Demographics', icon: FiBarChart, description: 'Audience demographics' },
    { id: 'sentiment', label: 'Sentiment', icon: FiActivity, description: 'Sentiment analysis' },
  ];

  const platforms = [
    { id: 'youtube', label: 'YouTube', icon: FiYoutube },
    { id: 'tiktok', label: 'TikTok', icon: FiMusic },
    { id: 'twitter', label: 'Twitter', icon: FiMessageCircle },
    { id: 'instagram', label: 'Instagram', icon: FiHeart },
    { id: 'facebook', label: 'Facebook', icon: FiUsers },
    { id: 'linkedin', label: 'LinkedIn', icon: FiBriefcase },
    { id: 'reddit', label: 'Reddit', icon: FiMessageSquare },
    { id: 'snapchat', label: 'Snapchat', icon: FiCamera },
  ];

  const regions = [
    { id: 'worldwide', flag: '🌍', name: 'Worldwide' },
    { id: 'US', flag: '🇺🇸', name: 'United States' },
    { id: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
    { id: 'CA', flag: '🇨🇦', name: 'Canada' },
    { id: 'AU', flag: '🇦🇺', name: 'Australia' },
    { id: 'FR', flag: '🇫🇷', name: 'France' },
    { id: 'DE', flag: '🇩🇪', name: 'Germany' },
    { id: 'IT', flag: '🇮🇹', name: 'Italy' },
    { id: 'ES', flag: '🇪🇸', name: 'Spain' },
    { id: 'NL', flag: '🇳🇱', name: 'Netherlands' },
    { id: 'RU', flag: '🇷🇺', name: 'Russia' },
    { id: 'BR', flag: '🇧🇷', name: 'Brazil' },
    { id: 'MX', flag: '🇲🇽', name: 'Mexico' },
    { id: 'AR', flag: '🇦🇷', name: 'Argentina' },
    { id: 'JP', flag: '🇯🇵', name: 'Japan' },
    { id: 'KR', flag: '🇰🇷', name: 'South Korea' },
    { id: 'CN', flag: '🇨🇳', name: 'China' },
    { id: 'IN', flag: '🇮🇳', name: 'India' },
    { id: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
    { id: 'AE', flag: '🇦🇪', name: 'UAE' },
    { id: 'EG', flag: '🇪🇬', name: 'Egypt' },
    { id: 'MA', flag: '🇲🇦', name: 'Morocco' },
    { id: 'DZ', flag: '🇩🇿', name: 'Algeria' },
    { id: 'TN', flag: '🇹🇳', name: 'Tunisia' },
    { id: 'JO', flag: '🇯🇴', name: 'Jordan' },
    { id: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  ];

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 320 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 z-50 overflow-hidden shadow-2xl"
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Logo */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  <img src="/logo.svg" alt="SocialSpy Logo" className="w-full h-full" />
                </div>
                {isOpen && (
                  <div>
                    <h1 className="font-bold text-white text-sm">SocialSpy</h1>
                    <p className="text-xs text-gray-400">Data Intelligence Platform</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
              >
                {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2 space-y-1">
              {/* Main Navigation */}
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    title={!isOpen ? section.label : ''}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                    {isOpen && (
                      <span className="font-medium text-sm">
                        {section.label}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Divider */}
              <div className="my-4 border-t border-gray-700"></div>

              {/* Data Collection Tools */}
              {isOpen && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                    Data Collection
                  </h3>
                </div>
              )}

              {/* Data Collection Tools Grid */}
              {isOpen ? (
                <div className="grid grid-cols-2 gap-2 px-2 mb-4">
                  {dataCollectionTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        className="p-3 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl border border-gray-600 hover:border-blue-500 transition-all duration-200 group"
                        title={tool.description}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Icon size={16} className="text-blue-400 group-hover:text-blue-300" />
                          <span className="text-xs text-gray-300 group-hover:text-white font-medium">
                            {tool.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  {dataCollectionTools.slice(0, 6).map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-700 hover:text-white"
                        title={tool.description}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* Filters - Only show when open */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-6 mt-4">
                {/* Search */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiSearch className="text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-300">{t('sidebar.search')}</h3>
                  </div>
                  <input
                    type="text"
                    placeholder={`${t('sidebar.search')}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                  />
                </div>

                {/* Platform Filters */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiLayers className="text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-300">{t('sidebar.platforms')}</h3>
                  </div>
                  <div className="space-y-2">
                    {platforms.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <label key={platform.id} className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform.id)}
                            onChange={() => togglePlatform(platform.id)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:border-blue-500 bg-gray-700"
                          />
                          <Icon size={16} className="text-gray-400 group-hover:text-gray-300" />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {platform.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Region Filter */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiGlobe className="text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-300">{t('sidebar.region')}</h3>
                  </div>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  >
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.flag} {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Button */}
          <div className="p-4 border-t border-gray-700">
            <button className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 font-bold text-sm shadow-lg">
              <span>SPY</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;