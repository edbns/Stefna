import React from 'react';
import { Plus, LogIn, User, LogOut, BookOpen } from 'lucide-react';
import authService from '../services/authService';

interface MobileFloatingNavProps {
  onUploadClick: () => void;
  onProfileClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onBestPracticesClick: () => void;
  isGenerating?: boolean;
}

const MobileFloatingNav: React.FC<MobileFloatingNavProps> = ({
  onUploadClick,
  onProfileClick,
  onLoginClick,
  onLogoutClick,
  onBestPracticesClick,
  isGenerating = false
}) => {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {/* Get The Look Button */}
      <button
        onClick={onBestPracticesClick}
        className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors relative group"
        title="Get The Look"
      >
        <BookOpen size={24} className="text-black" />
        
        {/* Hover Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Get The Look
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
        </div>
      </button>

      {/* Upload Button - Always visible */}
      <button
        onClick={onUploadClick}
        className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        title="Upload & Generate"
      >
        <Plus size={24} className="text-black" />
      </button>

      {/* Login or Profile Button - Context aware */}
      {isAuthenticated ? (
        <div className="relative">
          <button
            onClick={onProfileClick}
            className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="My Profile"
          >
            <User size={24} className="text-black" />
          </button>
          {/* Loading spinner around profile button when generating */}
          {isGenerating && (
            <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
          )}
        </div>
      ) : (
        <button
          onClick={onLoginClick}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Login"
        >
          <LogIn size={24} className="text-black" />
        </button>
      )}

      {/* Logout Button - Only visible when logged in */}
      {isAuthenticated && (
        <button
          onClick={onLogoutClick}
          className="w-14 h-14 bg-black rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
          title="Logout"
        >
          <LogOut size={24} className="text-white" />
        </button>
      )}
    </div>
  );
};

export default MobileFloatingNav;
