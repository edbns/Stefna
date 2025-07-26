import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiMenu, 
  FiUser, 
  FiLogOut, 
  FiSettings, 
  FiBell, 
  FiMessageCircle, 
  FiTrendingUp, 
  FiActivity 
} from 'react-icons/fi';

const Header = ({ sidebarOpen, setSidebarOpen, user, onAuthClick }) => {
  const { t, i18n } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white lg:hidden"
            title="Toggle Menu"
          >
            <FiMenu size={20} />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-white">SocialSpy</h1>
            <p className="text-xs text-gray-400">Data Intelligence Platform</p>
          </div>
        </div>

        {/* Center - Status indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white relative">
            <FiBell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* AI Chat Button */}
          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
            <FiMessageCircle size={20} />
          </button>

          {/* User Menu */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full flex items-center justify-center">
                  <FiUser size={16} />
                </div>
                <span className="hidden md:block text-sm font-medium">{user.email}</span>
              </button>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-lg transition-all duration-200 font-medium text-sm"
              >
                <FiUser size={16} />
                <span>Sign In</span>
              </button>
            )}

            {/* User Dropdown */}
            <AnimatePresence>
              {showUserMenu && user && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50"
                >
                  <div className="p-4 border-b border-gray-700">
                    <p className="text-white font-medium">{user.email}</p>
                    <p className="text-gray-400 text-sm">Premium User</p>
                  </div>
                  
                  <div className="p-2">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <FiSettings size={16} />
                      <span>Settings</span>
                    </button>
                    
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                      <FiActivity size={16} />
                      <span>Activity</span>
                    </button>
                    
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
                      <FiLogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;