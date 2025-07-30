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
      
      {/* Sidebar with Solid Black Background */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
        style={{
          background: '#000000',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
        {/* Header */}
        <div className={`${
          isOpen ? 'flex items-center justify-between h-20 p-4' : 'flex flex-col items-center justify-center h-20 p-2'
        } border-b border-white/10`}>
          {isOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-xl font-bold text-white">SocialSpy</h1>
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Categories */}
          <div className="px-4 mb-6">
            {isOpen && (
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                Categories
              </h3>
            )}
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="text-sm font-medium">{category.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platforms */}
          <div className="px-4 mb-6">
            {isOpen && (
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                Platforms
              </h3>
            )}
            <div className="space-y-1">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isActive = selectedPlatform === platform.id;
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => onPlatformChange(platform.id)}
                    disabled={platform.comingSoon}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/10'
                    } ${platform.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && (
                      <div className="flex items-center justify-between flex-1">
                        <span className="text-sm font-medium">{platform.label}</span>
                        {platform.comingSoon && (
                          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                            Soon
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Section */}
          <div className="px-4">
            {isOpen && (
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                Account
              </h3>
            )}
            <div className="space-y-1">
              {user ? (
                <>
                  <button
                    onClick={() => onCategoryChange('profile')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <User className="w-5 h-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="text-sm font-medium">{user.name || user.email}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setIsFollowingOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <Heart className="w-5 h-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="text-sm font-medium">Following</span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={onAuthOpen}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  {isOpen && (
                    <span className="text-sm font-medium">Sign In</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="space-y-1">
            <Link
              to="/privacy-policy"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              {isOpen && (
                <span className="text-xs">Privacy</span>
              )}
            </Link>
            <Link
              to="/terms-and-conditions"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {isOpen && (
                <span className="text-xs">Terms</span>
              )}
            </Link>
            <Link
              to="/cookies-policy"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Cookie className="w-4 h-4 flex-shrink-0" />
              {isOpen && (
                <span className="text-xs">Cookies</span>
              )}
            </Link>
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