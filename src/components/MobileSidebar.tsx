import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, User, LogOut, Coins, UserPlus, Image } from 'lucide-react';
import authService from '../services/authService';
import { useToasts } from './ui/Toasts';

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
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const isAuthenticated = authService.isAuthenticated();
  const { notifyReady, notifyError } = useToasts();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  // Fetch token count when authenticated
  useEffect(() => {
    const fetchTokenCount = async () => {
      if (isAuthenticated) {
        try {
          const token = authService.getToken();
          const response = await fetch('/.netlify/functions/getQuota', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          // Use currentBalance directly - same as desktop profile
          setTokenCount(data.currentBalance || 0);
        } catch (error) {
          console.error('Failed to fetch token count:', error);
          setTokenCount(0);
        }
      }
    };

    if (isOpen) {
      fetchTokenCount();
    }
  }, [isAuthenticated, isOpen]);

  return (
    <>
      {/* Hamburger Menu Button - Only show when authenticated */}
      {isAuthenticated && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[9999] text-white hover:text-white/70 transition-colors"
          title="Menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-[9999] h-full w-80 bg-black transform transition-transform duration-300 ease-in-out ${
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
          {/* Token Count - Only visible when logged in */}
          {isAuthenticated && (
            <div className="w-full flex items-center gap-3 p-3 text-white border-b border-white/10">
              <Coins size={20} />
              <span className="font-medium">Tokens: {tokenCount !== null ? tokenCount : '...'}</span>
            </div>
          )}

          {/* My Media */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                onProfileClick();
                closeSidebar();
              }}
              className="w-full flex items-center gap-3 p-3 text-white hover:text-white/70 transition-colors"
            >
              <Image size={20} />
              <span className="font-medium">My Media</span>
            </button>
          ) : null}

          {/* Invite - Only visible when logged in */}
          {isAuthenticated && (
            <button
              onClick={async () => {
                try {
                  // Use email-based referral system (not referral code)
                  const referrerEmail = authService.getCurrentUser()?.email;
                  if (!referrerEmail) {
                    notifyError({ title: 'Error', message: 'Unable to get your email for referral' });
                    return;
                  }
                  
                  const shareUrl = `${window.location.origin}/auth?referrer=${encodeURIComponent(referrerEmail)}`;
                  
                  if (navigator.share) {
                    await navigator.share({
                      title: 'Join me on Stefna AI',
                      text: 'Create amazing AI art with me!',
                      url: shareUrl
                    });
                  } else {
                    await navigator.clipboard.writeText(shareUrl);
                    notifyReady({ title: 'Link Copied', message: 'Invite link copied to clipboard!' });
                  }
                  closeSidebar();
                } catch (error) {
                  console.error('Share failed:', error);
                  notifyError({ title: 'Share Failed', message: 'Could not share invite link' });
                }
              }}
              className="w-full flex items-center gap-3 p-3 text-white hover:text-white/70 transition-colors"
            >
              <UserPlus size={20} />
              <span className="font-medium">Invite</span>
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

