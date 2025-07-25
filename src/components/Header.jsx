import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiSun, FiMoon } from 'react-icons/fi';

const Header = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is saved in localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left side - Menu button for mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <FiMenu size={20} />
            </button>
            
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('title')} - <span className="text-blue-600 dark:text-blue-400">{t('subtitle')}</span>
              </h1>
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-4">
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              title="Toggle Language"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentLang.label}
              </span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
              title="Toggle Theme"
            >
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">
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