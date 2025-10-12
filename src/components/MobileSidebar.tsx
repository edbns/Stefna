import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, User, LogOut, Coins, UserPlus, Image, Facebook as FacebookIcon, Youtube as YouTubeIcon } from 'lucide-react';
import authService from '../services/authService';
import { useToasts } from './ui/Toasts';
import { authenticatedFetch } from '../utils/apiClient';

// Custom TikTok icon
const TikTokIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.36 6.36 0 00-1-.05A6.35 6.35 0 005 15.77a6.34 6.34 0 0011.14 4.16v-6.61a8.16 8.16 0 004.65 1.46v-3.44a4.85 4.85 0 01-1.2-.65z"/>
  </svg>
)

// Custom X (formerly Twitter) icon
const XIconCustom = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

// Custom Reddit icon
const RedditIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
)

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
          const response = await authenticatedFetch('/.netlify/functions/getQuota', {
            method: 'GET'
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
          className="fixed top-4 left-4 z-[9999999] text-white hover:text-white/70 transition-colors"
          title="Menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Full-Screen Sidebar Overlay */}
      <div className={`fixed inset-0 z-[9999999] bg-black transform transition-transform duration-300 ease-in-out ${
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

        {/* Sidebar Content - Scrollable */}
        <div className="flex flex-col h-[calc(100%-80px)] justify-between px-4 py-2">
          {/* Menu Items */}
          <div className="space-y-2">
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

          {/* Social Media Icons - Bottom of Sidebar */}
          <div className="pb-4">
            <div className="flex items-center justify-center space-x-3 pt-4 border-t border-white/10">
              <a
                href="https://x.com/StefnaXYZ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="X"
              >
                <XIconCustom size={20} className="text-white" />
              </a>
              <a
                href="https://www.facebook.com/Stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Facebook"
              >
                <FacebookIcon size={20} className="text-white" />
              </a>
              <a
                href="https://www.tiktok.com/@stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="TikTok"
              >
                <TikTokIcon size={20} className="text-white" />
              </a>
              <a
                href="https://www.reddit.com/user/StefnaXYZ/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Reddit"
              >
                <RedditIcon size={20} className="text-white" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="YouTube"
              >
                <YouTubeIcon size={20} className="text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;

