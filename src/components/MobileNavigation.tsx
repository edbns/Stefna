import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface MobileNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSearchOpen: () => void;
  selectedPlatform?: string;
  onPlatformChange?: (platform: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPage,
  onNavigate,
  onSearchOpen,
  selectedPlatform = 'all',
  onPlatformChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon }
  ];

  const platforms = [
    { id: 'all', label: 'All', icon: GlobeAltIcon },
    { id: 'youtube', label: 'YouTube' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'twitter', label: 'Twitter/X' }
  ];

  return (
    <>
      {/* Enhanced Mobile Header with Platform Selector */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#eee9dd] border-b border-[#2a4152]/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-[#2a4152]/5 hover:bg-[#2a4152]/10 transition-colors"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6 text-[#2a4152]" />
                ) : (
                  <Bars3Icon className="w-6 h-6 text-[#2a4152]" />
                )}
              </button>
              <h1 className="text-xl font-bold text-[#2a4152] font-['Figtree']">
                Stefna
              </h1>
            </div>
            
            <button
              onClick={onSearchOpen}
              className="p-2 rounded-lg bg-[#2a4152]/5 hover:bg-[#2a4152]/10 transition-colors"
            >
              <MagnifyingGlassIcon className="w-6 h-6 text-[#2a4152]" />
            </button>
          </div>
          
          {/* Platform Pills */}
          {onPlatformChange && (
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => onPlatformChange(platform.id)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedPlatform === platform.id
                      ? 'bg-[#2a4152] text-[#eee9dd]'
                      : 'bg-[#2a4152]/10 text-[#2a4152] hover:bg-[#2a4152]/20'
                  }`}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-80 bg-[#eee9dd] border-r border-[#2a4152]/10 pt-20"
          >
            <div className="px-4 py-6">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-['Figtree'] ${
                        isActive
                          ? 'bg-[#2a4152] text-[#eee9dd] shadow-lg'
                          : 'text-[#2a4152] hover:bg-[#2a4152]/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#eee9dd] border-t border-[#2a4152]/10 px-4 py-2">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-[#2a4152]'
                    : 'text-[#2a4152]/60 hover:text-[#2a4152]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium font-['Figtree']">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;