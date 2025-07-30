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
  PanelLeftOpen,
  Music2,
  TrendingDown,
  Newspaper,
  Coins,
  Hash as HashIcon,
  Tag
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
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

  const mainNavigation = [
    { id: 'trending', label: 'YouTube', icon: Youtube },
    { id: 'crypto-trends', label: 'Crypto', icon: Coins },
    { id: 'news-trends', label: 'News', icon: Newspaper },
    { id: 'music-trends', label: 'Music', icon: Music2 },
    { id: 'trending-hashtags', label: 'Hashtags', icon: HashIcon },
    { id: 'trending-categories', label: 'Categories', icon: Tag },
    { id: 'global-reach', label: 'Global Reach', icon: Globe }
  ];

  const tools = [
    { id: 'youtube-summarizer', label: 'YouTube Summarizer', icon: PlayCircle },
    { id: 'sentiment-analysis', label: 'Sentiment Analysis', icon: Heart }
  ];

  // Removed platforms section since we now have dedicated content sections

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
      <div className={`fixed top-0 h-full z-50 transition-all duration-300 flex flex-col ${
        isOpen ? 'left-0 w-64' : 'left-4 w-20'
      } ${!isOpen ? 'shadow-2xl' : ''}`}
        style={{
          background: '#000000',
          borderRight: isOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          borderRadius: isOpen ? '0' : '12px',
          margin: isOpen ? '0' : '8px 0 8px 0'
        }}>
        
        {/* Header */}
        <div className={`${
          isOpen ? 'flex items-center justify-between h-20 p-4' : 'flex flex-col items-center justify-center h-20 p-3'
        } border-b border-white/10`}>
          {isOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-xl font-bold text-white">Stefna</h1>
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
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center mb-2">
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
          <div className={isOpen ? "px-4" : "px-2"}>
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
                    } transition-all duration-200 rounded-md p-2`}
                  >
                    <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
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
          <div className={isOpen ? "px-4" : "px-2"}>
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
                    } transition-all duration-200 rounded-md p-2`}
                  >
                    <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
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
            <div className={isOpen ? "px-4" : "px-2"}>
              <div className="space-y-1">
                {userFeatures.map((item) => {
                  const Icon = item.icon;
                  const isActive = selectedCategory === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'following') {
                          onCategoryChange('following');
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
                      } transition-all duration-200 rounded-md p-2`}
                    >
                      <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
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

          {/* Platform Filters - Removed since we have dedicated content sections */}
        </nav>

        {/* Footer */}
        <div className={isOpen ? "px-4 py-4" : "px-2 py-4"} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="space-y-1">
              <Link
                to="/privacy-policy"
              className={`flex items-center px-3 py-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 ${
                isOpen ? 'gap-3' : 'justify-center'
              }`}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              {isOpen && (
                <span className="text-xs">Privacy</span>
              )}
              </Link>
              <Link
              to="/terms-and-conditions"
              className={`flex items-center px-3 py-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 ${
                isOpen ? 'gap-3' : 'justify-center'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {isOpen && (
                <span className="text-xs">Terms</span>
              )}
              </Link>
              <Link
              to="/cookies-policy"
              className={`flex items-center px-3 py-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 ${
                isOpen ? 'gap-3' : 'justify-center'
              }`}
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
      {/* FollowingManager component is removed as per the edit hint */}
    </>
  );
};

export default Sidebar;