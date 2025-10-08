import React, { useState } from 'react';
import { Menu, X, LogIn, User, LogOut, BookOpen, FileText } from 'lucide-react';
import authService from '../services/authService';

interface MobileSidebarProps {
  onProfileClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onBestPracticesClick: () => void;
  onStoriesClick: () => void;
  isGenerating?: boolean;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  onProfileClick,
  onLoginClick,
  onLogoutClick,
  onBestPracticesClick,
  onStoriesClick,
  isGenerating = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 text-white hover:text-white/70 transition-colors"
        title="Menu"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-50 h-full w-80 bg-black transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-end p-4">
          <button
            onClick={closeSidebar}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="px-4 py-2 space-y-2">
          {/* Get The Look */}
          <button
            onClick={() => {
              onBestPracticesClick();
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 p-3 text-white hover:text-white/70 transition-colors"
          >
            <BookOpen size={20} />
            <span className="font-medium">Get The Look</span>
          </button>

          {/* Stories - HIDDEN */}
          {/* <button
            onClick={() => {
              onStoriesClick();
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 p-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileText size={20} className="text-white" />
            <span className="text-white font-medium">Stories</span>
          </button> */}

          {/* Profile/Login */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => {
                  onProfileClick();
                  closeSidebar();
                }}
                className="w-full flex items-center gap-3 p-3 text-white hover:text-white/70 transition-colors"
              >
                <User size={20} />
                <span className="font-medium">My Profile</span>
              </button>
              {/* Loading spinner around profile button when generating */}
              {isGenerating && (
                <div className="absolute inset-0 rounded-lg border-2 border-white/30 border-t-white animate-spin"></div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                onLoginClick();
                closeSidebar();
              }}
              className="w-full flex items-center gap-3 p-3 text-white hover:text-white/70 transition-colors"
            >
              <LogIn size={20} />
              <span className="font-medium">Login</span>
            </button>
          )}

          {/* Logout - Only visible when logged in */}
          {isAuthenticated && (
            <button
              onClick={() => {
                onLogoutClick();
                closeSidebar();
              }}
              className="w-full flex items-center gap-3 p-3 text-white hover:text-white/70 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;

