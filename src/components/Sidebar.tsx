import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  Settings,
  X,
  Menu,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  User,
  Hash,
  Heart,
  Globe,
  PlayCircle,
  MessageSquare as Reddit,
  Shield,
  Cookie,
  FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Grid } from 'lucide-react';
import FollowingManager from './FollowingManager';
import RedditIcon from './icons/RedditIcon';
import TikTokIcon from './icons/TikTokIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAuthOpen: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
  selectedPlatform,
  onPlatformChange,
  selectedCategory,
  onCategoryChange,
  onAuthOpen
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);

  const categories = [
    { id: 'trending', label: t('nav.trending'), icon: TrendingUp },
    { id: 'trending-categories', label: 'Trending Categories', icon: BarChart3, requiresAuth: false },
    { id: 'trending-hashtags', label: 'Trending Hashtags', icon: Hash, requiresAuth: false },
    { id: 'trending-creators', label: 'Trending Creators', icon: Users, requiresAuth: false },
    { id: 'youtube-summarizer', label: 'YouTube Summarizer', icon: PlayCircle, requiresAuth: false },
    { id: 'sentiment-analysis', label: 'Sentiment Analysis', icon: Heart, requiresAuth: false },
    { id: 'global-reach', label: 'Global Reach', icon: Globe, requiresAuth: false }
  ];

  // Update the platforms array to use custom icons:
  const platforms = [
    { id: 'all', label: t('platforms.all'), icon: Grid },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'tiktok', label: 'TikTok', icon: TikTokIcon },
    { id: 'reddit', label: 'Reddit', icon: RedditIcon },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'twitter', label: 'Twitter/X', icon: Twitter, comingSoon: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar with Enhanced Glass Effect */}
      {/* Sidebar with Solid Black Background */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
        style={{
          background: '#000000',
          borderRight: '1px solid rgba(148, 163, 184, 0.3)'
        }}>
        {/* Header */}
        <div className={`${
          isOpen ? 'flex items-center justify-between h-20 p-4' : 'flex flex-col items-center justify-center h-20 p-2'
        }`}>
          {/* Bouncing Text */}
          {isOpen ? (
            <div className="flex items-center">
              {/* Full bouncing text when sidebar is open */}
              <h1 className="text-2xl font-bold text-white tracking-wider font-figtree">
                <span className="inline-block" style={{ animation: 'bounce 1s ease-in-out 0s 1 normal forwards' }}>S</span>
                <span className="inline-block" style={{ animation: 'bounce 1s ease-in-out 0.2s 1 normal forwards' }}>t</span>
                <span className="inline-block" style={{ animation: 'bounce 1s ease-in-out 0.4s 1 normal forwards' }}>e</span>
                <span className="inline-block" style={{ animation: 'bounce 1s ease-in-out 0.6s 1 normal forwards' }}>f</span>
                <span className="inline-block" style={{ animation: 'bounce 1s ease-in-out 0.8s 1 normal forwards' }}>n</span>
                <span className="inline-block" style={{ animation: 'bounce 1s ease-in-out 1.0s 1 normal forwards' }}>a</span>
              </h1>
            </div>
          ) : (
            <>
              {/* Just 'S' when sidebar is collapsed */}
              <div className="mb-1">
                <h1 className="text-xl font-bold text-white tracking-wider font-figtree">
                  <span className="inline-block" style={{ animation: 'bounce 1s ease-in-out 0s 1 normal forwards' }}>S</span>
                </h1>
              </div>
              {/* Hamburger button for collapsed state */}
              <button
                onClick={onToggle}
                className="p-1 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-0 focus:border-none"
                style={{ outline: 'none', boxShadow: 'none' }}
              >
                <div className="w-4 h-4 flex flex-col justify-center items-center">
                  <span className="bg-white block transition-all duration-300 ease-out h-0.5 w-4 rounded-sm -translate-y-0.5"></span>
                  <span className="bg-white block transition-all duration-300 ease-out h-0.5 w-4 rounded-sm my-0.5 opacity-100"></span>
                  <span className="bg-white block transition-all duration-300 ease-out h-0.5 w-4 rounded-sm translate-y-0.5"></span>
                </div>
              </button>
            </>
          )}
          
          {/* Animated Hamburger Menu Button - only when open */}
          {isOpen && (
            <button
              onClick={onToggle}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-0 focus:border-none"
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                  isOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'
                }`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm my-0.5 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                  isOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'
                }`}></span>
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Categories */}
          <div className="px-3 py-3">
            <nav className="space-y-1">
              {/* Remove this line: // In the categories mapping, add this condition: */}
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                const isDisabled = category.requiresAuth && !user;
                
                // Handle Following menu item specially
                if (category.id === 'following') {
                  return (
                    <button
                      key={category.id}
                      onClick={() => setIsFollowingOpen(true)}
                      className={`w-full flex items-center gap-3 ${
                        isOpen ? 'px-3' : 'justify-center px-0'
                      } py-2.5 text-left rounded-lg transition-all duration-300 group focus:outline-none focus:ring-0 focus:border-none text-gray-200 hover:bg-white hover:bg-opacity-10 hover:shadow-lg hover:shadow-white/5 hover:text-white`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110 drop-shadow-sm" />
                      {isOpen && (
                        <span className="font-medium font-['Figtree'] drop-shadow-sm">
                          {category.label}
                        </span>
                      )}
                    </button>
                  );
                }
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      if (isDisabled) {
                        onAuthOpen();
                      } else {
                        onCategoryChange(category.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 ${
                      isOpen ? 'px-3' : 'justify-center px-0'
                    } py-2.5 text-left rounded-lg transition-all duration-300 group focus:outline-none focus:ring-0 focus:border-none ${
                      isActive && !isDisabled
                        ? 'bg-gradient-to-r from-blue-500/40 to-purple-500/40 text-white shadow-lg shadow-blue-500/30 border border-white/20 backdrop-blur-sm'
                        : isDisabled
                        ? 'text-gray-300 hover:bg-white hover:bg-opacity-5'
                        : 'text-gray-200 hover:bg-white hover:bg-opacity-10 hover:shadow-lg hover:shadow-white/5 hover:text-white'
                    } ${
                      isDisabled ? 'cursor-pointer' : ''
                    }`}
                    style={{ outline: 'none', boxShadow: isActive && !isDisabled ? undefined : 'none' }}
                    title={!isOpen ? category.label : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${
                      isDisabled ? 'opacity-50' : 'drop-shadow-sm'
                    }`} />
                    {isOpen && (
                      <span className="font-medium font-['Figtree'] drop-shadow-sm">
                        {category.label}
                        {category.requiresAuth && !user && (
                          <span className="text-xs opacity-60 ml-1">*</span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Platform Filters */}
          <div className="px-3 mb-3">
            <nav className="space-y-1">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isActive = selectedPlatform === platform.id;
                const isComingSoon = platform.comingSoon;
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => !isComingSoon && onPlatformChange(platform.id)}
                    className={`w-full flex items-center gap-3 ${
                      isOpen ? 'px-3' : 'justify-center px-0'
                    } py-2.5 text-left rounded-lg transition-all duration-300 group focus:outline-none focus:ring-0 focus:border-none ${
                      isActive && !isComingSoon
                        ? 'bg-gradient-to-r from-green-500/40 to-blue-500/40 text-white shadow-lg shadow-green-500/30 border border-white/20 backdrop-blur-sm'
                        : isComingSoon
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-200 hover:bg-white hover:bg-opacity-10 hover:shadow-lg hover:shadow-white/5 hover:text-white'
                    }`}
                    style={{ outline: 'none', boxShadow: isActive && !isComingSoon ? undefined : 'none' }}
                    title={isComingSoon ? 'Coming Soon' : (!isOpen ? platform.label : '')}
                    disabled={isComingSoon}
                  >
                    {platform.logo ? (
                      <div className={`w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${platform.color} ${
                        isComingSoon ? 'opacity-50' : 'drop-shadow-sm'
                      }`}>
                        {platform.logo}
                      </div>
                    ) : (
                      Icon && <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${platform.color} ${
                        isComingSoon ? 'opacity-50' : 'drop-shadow-sm'
                      }`} />
                    )}
                    {isOpen && (
                      <span className={`font-['Figtree'] drop-shadow-sm ${
                        isComingSoon ? 'opacity-50' : ''
                      }`}>{platform.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Legal Links - moved inside the sidebar container */}
          <div className="border-t border-gray-200/20 dark:border-gray-700/20 pt-4 mt-4 px-3">
            {isOpen && (
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Legal
              </p>
            )}
            <div className="space-y-1">
              <Link
                to="/privacy-policy"
                className={`flex items-center ${
                  isOpen ? 'px-3 py-2 text-sm' : 'justify-center px-0 py-2.5'
                } text-gray-200 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300`}
                title={!isOpen ? 'Privacy Policy' : ''}
              >
                <Shield className={`${isOpen ? 'w-4 h-4 mr-3' : 'w-5 h-5'} flex-shrink-0 transition-all duration-300 hover:scale-110 drop-shadow-sm`} />
                {isOpen && <span className="font-['Figtree'] drop-shadow-sm">Privacy Policy</span>}
              </Link>
              <Link
                to="/cookies-policy"
                className={`flex items-center ${
                  isOpen ? 'px-3 py-2 text-sm' : 'justify-center px-0 py-2.5'
                } text-gray-200 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300`}
                title={!isOpen ? 'Cookies Policy' : ''}
              >
                <Cookie className={`${isOpen ? 'w-4 h-4 mr-3' : 'w-5 h-5'} flex-shrink-0 transition-all duration-300 hover:scale-110 drop-shadow-sm`} />
                {isOpen && <span className="font-['Figtree'] drop-shadow-sm">Cookies Policy</span>}
              </Link>
              <Link
                to="/terms-and-conditions"
                className={`flex items-center ${
                  isOpen ? 'px-3 py-2 text-sm' : 'justify-center px-0 py-2.5'
                } text-gray-200 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-300`}
                title={!isOpen ? 'Terms & Conditions' : ''}
              >
                <FileText className={`${isOpen ? 'w-4 h-4 mr-3' : 'w-5 h-5'} flex-shrink-0 transition-all duration-300 hover:scale-110 drop-shadow-sm`} />
                {isOpen && <span className="font-['Figtree'] drop-shadow-sm">Terms & Conditions</span>}
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add FollowingManager inside the component */}
      <FollowingManager
        isOpen={isFollowingOpen}
        onClose={() => setIsFollowingOpen(false)}
      />
    </>
  );
};

export default Sidebar;