import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiMenu, 
  FiUser, 
  FiLogOut, 
  FiSettings, 
  FiBell, 
  FiSearch,
  FiMessageCircle,
  FiTrendingUp,
  FiActivity
} from 'react-icons/fi';

const Header = ({ onMenuClick, user, onAuthClick }) => {
  const { t, i18n } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleLanguage = () => {
    const languages = ['en', 'fr'];
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const newLang = languages[nextIndex];
    i18n.changeLanguage(newLang);
  };

  const getLanguageData = () => {
    const langData = {
      en: { label: 'EN' },
      fr: { label: 'FR' }
    };
    return langData[i18n.language] || langData.en;
  };

  const currentLang = getLanguageData();

  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 sticky top-0 z-40 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left side - Menu button for mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            >
              <FiMenu size={20} />
            </button>
            
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold text-white">
                SocialSpy - <span className="text-blue-400">Data Intelligence Platform</span>
              </h1>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search trends, content, analytics..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600"
              title="Toggle Language"
            >
              <span className="text-sm font-medium text-gray-300">
                {currentLang.label}
              </span>
            </button>

            {/* AI Chat Button */}
            <button
              className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-white"
              title="AI Assistant"
            >
              <FiMessageCircle size={18} />
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-400 hover:text-white relative"
              title="Notifications"
            >
              <FiBell size={18} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300 hover:text-white"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FiUser size={16} className="text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-2xl z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm text-gray-300">{user.email}</p>
                        <p className="text-xs text-gray-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                        <FiUser size={16} />
                        <span>Profile</span>
                      </button>
                      
                      <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                        <FiSettings size={16} />
                        <span>Settings</span>
                      </button>
                      
                      <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors">
                        <FiLogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200"
              >
                <FiUser size={16} />
                <span className="hidden sm:block">Sign In</span>
              </button>
            )}

            {/* Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">
                Live
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;