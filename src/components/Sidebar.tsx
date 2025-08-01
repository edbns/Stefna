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
  Tag,
  Filter,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import RedditIcon from './icons/RedditIcon';
import BlueskyIcon from './icons/BlueskyIcon';
import HackerNewsIcon from './icons/HackerNewsIcon';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['trending']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const mainNavigation = [
    { 
      id: 'trending', 
      label: 'Trending', 
      icon: TrendingUp,
      items: [
        { id: 'global-reach', label: 'Global Reach', icon: Globe },
        { id: 'trending', label: 'YouTube', icon: Youtube },
        { id: 'reddit-trends', label: 'Reddit', icon: RedditIcon },
        { id: 'bluesky-trends', label: 'Bluesky', icon: BlueskyIcon },
        { id: 'hackernews-trends', label: 'Hacker News', icon: HackerNewsIcon },
        { id: 'crypto-trends', label: 'Crypto', icon: Coins },
        { id: 'news-trends', label: 'News', icon: Newspaper },
        { id: 'music-trends', label: 'Music', icon: Music2 }
      ]
    },
    { 
      id: 'ai-tools', 
      label: 'AI Tools', 
      icon: Sparkles,
      items: [
        { id: 'youtube-summarizer', label: 'YouTube Summarizer', icon: PlayCircle },
        { id: 'content-generator', label: 'Content Generator', icon: Sparkles },
        { id: 'caption-writer', label: 'Caption Writer', icon: MessageSquare },
        { id: 'tweet-creator', label: 'X Creator', icon: Twitter },
        { id: 'sentiment-analyzer', label: 'Sentiment Analyzer', icon: BarChart3 },
        { id: 'hashtag-generator', label: 'Hashtag Generator', icon: Hash }
      ]
    },
    { 
      id: 'filters', 
      label: 'Filters', 
      icon: Filter,
      items: [
        { id: 'mega-filter', label: 'Advanced Filters', icon: Filter },
        { id: 'trending-categories', label: 'Categories', icon: Tag },
        { id: 'trending-hashtags', label: 'Hashtags', icon: HashIcon }
      ]
    }
  ];

  // User features removed - dashboard can be accessed from header menu

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
          
          {/* Stefna AI Chat - Standalone at top */}
          <div className={isOpen ? "px-4" : "px-2"}>
            <button
              onClick={() => onCategoryChange('stefna-ai-chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                selectedCategory === 'stefna-ai-chat'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              {isOpen && (
                <div className="flex-1">
                  <div className="font-semibold text-sm">Stefna AI Chat</div>
                  <div className="text-xs opacity-70">Your AI Companion</div>
                </div>
              )}
            </button>
          </div>

          {/* Main Navigation */}
          <div className={isOpen ? "px-4" : "px-2"}>
            <div className="space-y-1">
              {mainNavigation.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedSections.has(section.id);
                
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`w-full group relative ${
                        selectedCategory === section.id
                          ? 'bg-white text-black'
                          : 'text-white hover:bg-white/10'
                      } transition-all duration-200 rounded-md p-2`}
                    >
                      <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && (
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{section.label}</div>
                          </div>
                        )}
                        {isOpen && (
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                    
                    {/* Dropdown Items */}
                    {isOpen && isExpanded && (
                      <div className="ml-6 mt-2 space-y-1">
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = selectedCategory === item.id;
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => onCategoryChange(item.id)}
                              className={`w-full group relative ${
                                isActive
                                  ? 'bg-white text-black'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              } transition-all duration-200 rounded-md p-2 text-sm`}
                            >
                              <div className="flex items-center gap-3">
                                <ItemIcon className="w-4 h-4 flex-shrink-0" />
                                <div className="font-medium">{item.label}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Features removed - dashboard accessible from header menu */}
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
    </>
  );
};

export default Sidebar;