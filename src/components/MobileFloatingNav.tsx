import React from 'react';
import { Plus, LogIn, User, LogOut } from 'lucide-react';
import authService from '../services/authService';

interface MobileFloatingNavProps {
  onUploadClick: () => void;
  onProfileClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  isGenerating?: boolean;
}

const MobileFloatingNav: React.FC<MobileFloatingNavProps> = ({
  onUploadClick,
  onProfileClick,
  onLoginClick,
  onLogoutClick,
  isGenerating = false
}) => {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
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
          className="w-14 h-14 bg-red-500 rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Logout"
        >
          <LogOut size={24} className="text-white" />
        </button>
      )}
    </div>
  );
};

export default MobileFloatingNav;
