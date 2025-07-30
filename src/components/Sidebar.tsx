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
  FileText,
  Bookmark,
  Eye,
  Bell,
  Grid,
  Sparkles,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { user, logout } = useAuth();
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);

  const mainNavigation = [
    { id: 'trending', label: 'Trending Posts', icon: TrendingUp },
    { id: 'trending-categories', label: 'Categories', icon: BarChart3 },
    { id: 'trending-hashtags', label: 'Hashtags', icon: Hash },
    { id: 'trending-creators', label: 'Creators', icon: Users },
    { id: 'global-reach', label: 'Global Reach', icon: Globe }
  ];

  const tools = [
    { id: 'youtube-summarizer', label: 'YouTube Summarizer', icon: PlayCircle },
    { id: 'sentiment-analysis', label: 'Sentiment Analysis', icon: Heart }
  ];

  const platforms = [
    { id: 'all', label: 'All Platforms', icon: Grid },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'tiktok', label: 'TikTok', icon: TikTokIcon },
    { id: 'reddit', label: 'Reddit', icon: RedditIcon },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'twitter', label: 'Twitter/X', icon: Twitter, comingSoon: true },
  ];

  const userFeatures = user ? [
    { id: 'saved', label: 'Saved Content', icon: Bookmark },
    { id: 'monitoring', label: 'Monitoring', icon: Eye },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'following', label: 'Following', icon: Heart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'logout', label: 'Logout', icon: LogOut, isLogout: true }
  ] : [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      } ${!isOpen ? 'shadow-2xl' : ''}`}
        style={{
          background: '#000000',
          borderRight: isOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          borderRadius: isOpen ? '0' : '0 12px 12px 0',
          margin: isOpen ? '0' : '8px 0 8px 8px'
        }}>
        
        {/* Header */}
        <div className={`${
          isOpen ? 'flex items-center justify-between h-20 p-4' : 'flex flex-col items-center justify-center h-20 p-2'
        } border-b border-white/10`}>
          {isOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-xl font-bold text-white">SocialSpy</h1>
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <PanelLeftClose className="w-5 h-5 text-white" />
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <PanelLeftOpen className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-3">
          
          {/* Main Navigation */}
          <div className="px-4">
            <div className="space-y-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = selectedCategory === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onCategoryChange(item.id)}
                    className={`w-full group relative ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/10'
                    } transition-all duration-200 rounded-lg p-2`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && (
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{item.label}</div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tools Section */}
          <div className="px-4">
            <div className="space-y-1">
              {tools.map((item) => {
                const Icon = item.icon;
                const isActive = selectedCategory === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onCategoryChange(item.id)}
                    className={`w-full group relative ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/10'
                    } transition-all duration-200 rounded-lg p-2`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && (
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{item.label}</div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Features - Only show if logged in */}
          {user && userFeatures.length > 0 && (
            <div className="px-4">
              <div className="space-y-1">
                {userFeatures.map((item) => {
                  const Icon = item.icon;
                  const isActive = selectedCategory === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'following') {
                          setIsFollowingOpen(true);
                        } else if (item.id === 'logout') {
                          logout();
                        } else {
                          onCategoryChange(item.id);
                        }
                      }}
                      className={`w-full group relative ${
                        isActive
                          ? 'bg-white text-black'
                          : 'text-white hover:bg-white/10'
                      } transition-all duration-200 rounded-lg p-2`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && (
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{item.label}</div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Platform Filters */}
          <div className="px-4">
            <div className="space-y-1">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isActive = selectedPlatform === platform.id;
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => onPlatformChange(platform.id)}
                    disabled={platform.comingSoon}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 ${
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
      
      {/* FollowingManager */}
      <FollowingManager
        isOpen={isFollowingOpen}
        onClose={() => setIsFollowingOpen(false)}
      />
    </>
  );
};

export default Sidebar;