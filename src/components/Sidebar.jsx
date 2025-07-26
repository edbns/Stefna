import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiMonitor,
  FiTrendingUp,
  FiBarChart,
  FiSettings,
  FiMenu,
  FiX,
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
    { id: 'dashboard', label: 'Dashboard', icon: FiMonitor },
    { id: 'trending', label: 'Trending', icon: FiTrendingUp },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart },
    { id: 'settings', label: 'Settings', icon: FiSettings },
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
        animate={{ width: isOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-black border-r border-gray-700 z-50 overflow-hidden shadow-2xl"
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo and Toggle */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Logo */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600">
                  <img src="/logo.svg" alt="SocialSpy Logo" className="w-6 h-6" />
                </div>
                {isOpen && (
                  <div>
                    <h1 className="font-bold text-white text-sm">SocialSpy</h1>
                    <p className="text-xs text-gray-400">Data Intelligence</p>
                  </div>
                )}
              </div>
              
              {/* Clear Toggle Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
                title={isOpen ? "Close Menu" : "Open Menu"}
              >
                {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-3 space-y-2">
              {/* Main Navigation */}
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg'
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
            </nav>

            {/* Filters - Only show when open */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-6 mt-6">
                {/* Search */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiSearch className="text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-300">Search</h3>
                  </div>
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-white placeholder-gray-400"
                  />
                </div>

                {/* Platform Filters */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiTrendingUp className="text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-300">Platforms</h3>
                  </div>
                  <div className="space-y-2">
                    {platforms.map((platform) => (
                      <label key={platform.id} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform.id)}
                          onChange={() => togglePlatform(platform.id)}
                          className="rounded border-gray-600 text-gray-500 focus:ring-gray-500 focus:border-gray-500 bg-gray-800"
                        />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {platform.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Region Filter */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FiGlobe className="text-gray-400" size={16} />
                    <h3 className="text-sm font-semibold text-gray-300">Region</h3>
                  </div>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-white"
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
            <button className="w-full h-10 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-lg flex items-center justify-center transition-all duration-200 font-medium text-sm">
              {isOpen ? "Get Started" : "→"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
