import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiHome, 
  FiTrendingUp, 
  FiYoutube, 
  FiMusic, 
  FiSettings, 
  FiMenu, 
  FiX,
  FiFilter,
  FiSearch,
  FiGlobe
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
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: FiHome },
    { id: 'trending', label: t('sidebar.trending'), icon: FiTrendingUp },
    { id: 'youtube', label: t('sidebar.youtube'), icon: FiYoutube },
    { id: 'tiktok', label: t('sidebar.tiktok'), icon: FiMusic },
    { id: 'settings', label: t('sidebar.settings'), icon: FiSettings },
  ];

  const platforms = [
    { id: 'youtube', label: 'YouTube' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'twitter', label: 'Twitter' },
    { id: 'instagram', label: 'Instagram' },
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
        animate={{ width: isOpen ? 280 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 overflow-hidden shadow-lg"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {isOpen && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-gray-900 dark:text-white text-sm">{t('title')}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={!isOpen ? section.label : ''}
                  >
                    <Icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                    {isOpen && (
                      <span className="font-medium text-sm">
                        {section.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Filters - Only show when open */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-6">
                {/* Search */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiSearch className="text-gray-500 dark:text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('sidebar.search')}</h3>
                  </div>
                  <input
                    type="text"
                    placeholder={`${t('sidebar.search')}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Platform Filters */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiFilter className="text-gray-500 dark:text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('sidebar.platforms')}</h3>
                  </div>
                  <div className="space-y-2">
                    {platforms.map((platform) => (
                      <label key={platform.id} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform.id)}
                          onChange={() => togglePlatform(platform.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {platform.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Region Filter */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiGlobe className="text-gray-500 dark:text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('sidebar.region')}</h3>
                  </div>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                  >
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;