import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import userMediaService, { UserMedia } from '../services/userMediaService';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useProfile } from '../contexts/ProfileContext';
import { authenticatedFetch } from '../utils/apiClient';
import { useToasts } from '../components/ui/Toasts';

const MobileGalleryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profileData, updateProfile } = useProfile();
  const { notifyReady, notifyError } = useToasts();
  const [userMedia, setUserMedia] = useState<UserMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<UserMedia | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [deletingMediaIds, setDeletingMediaIds] = useState<Set<string>>(new Set());
  const [tokenCount, setTokenCount] = useState(0);

  // Load user media and token count
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Load user media
        const media = await userMediaService.getUserMedia();
        setUserMedia(media);
        
        // Load token count
        try {
          const qRes = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' });
          if (qRes.ok) {
            const quotaData = await qRes.json();
            setTokenCount(quotaData.quota?.remaining || 0);
          }
        } catch (error) {
          console.error('Failed to load token count:', error);
        }
      } catch (error) {
        console.error('Failed to load user media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Update user settings helper
  const updateUserSettings = async (shareToFeed: boolean) => {
    const token = authService.getToken();
    if (!token) return;
    try {
      console.log('💾 [User Settings] Updating share_to_feed to:', shareToFeed);
      const r = await authenticatedFetch('/.netlify/functions/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_to_feed: shareToFeed })
      });
      if (r.ok) {
        console.log('✅ [User Settings] Share to feed updated successfully');
      } else {
        console.error('❌ [User Settings] Failed to update share to feed');
      }
    } catch (error) {
      console.error('❌ [User Settings] Error updating share to feed:', error);
    }
  };

  const handleMediaClick = (media: UserMedia) => {
    setSelectedMedia(media);
    setIsViewerOpen(true);
  };

  const handleDownload = async (media: UserMedia) => {
    try {
      const link = document.createElement('a');
      link.href = media.url;
      link.download = `stefna-${media.id}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async (media: UserMedia) => {
    try {
      setDeletingMediaIds(prev => new Set(prev).add(media.id));
      await userMediaService.deleteMedia(media.id);
      setUserMedia(prev => prev.filter(m => m.id !== media.id));
      
      // Close viewer if deleting the currently viewed media
      if (selectedMedia?.id === media.id) {
        setIsViewerOpen(false);
        setSelectedMedia(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingMediaIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(media.id);
        return newSet;
      });
    }
  };

  const handleShare = async (media: UserMedia) => {
    try {
      if (navigator.share) {
        // Use native share API on mobile
        await navigator.share({
          title: 'Check out my AI creation!',
          text: `Created with Stefna AI - ${getMediaTypeDisplay(media)}`,
          url: media.url,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(media.url);
        alert('Media URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(media.url);
        alert('Media URL copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard copy failed:', clipboardError);
      }
    }
  };

  const handlePrevious = () => {
    if (!selectedMedia) return;
    const currentIndex = userMedia.findIndex(m => m.id === selectedMedia.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : userMedia.length - 1;
    setSelectedMedia(userMedia[previousIndex]);
  };

  const handleNext = () => {
    if (!selectedMedia) return;
    const currentIndex = userMedia.findIndex(m => m.id === selectedMedia.id);
    const nextIndex = currentIndex < userMedia.length - 1 ? currentIndex + 1 : 0;
    setSelectedMedia(userMedia[nextIndex]);
  };

  // Function to get proper media type display
  const getMediaTypeDisplay = (media: UserMedia): string => {
    const actualType = media.metadata?.presetType || media.type
    const actualPresetKey = media.metadata?.presetKey || media.presetKey
    
    const typeNames: Record<string, string> = {
      'neo_glitch': 'Neo Tokyo Glitch',
      'ghibli_reaction': 'Ghibli Reaction',
      'unreal_reflection': 'Unreal Reflection',
      'presets': 'Presets',
      'custom_prompt': 'Custom Prompt',
      'story_time': 'Story Time',
      'story': 'Story Time',
      'edit': 'Studio',
      'parallel_self': 'Parallel Self',
      'neo-glitch': 'Neo Tokyo Glitch',
      'ghiblireact': 'Ghibli Reaction',
      'unrealreflection': 'Unreal Reflection',
      'preset': 'Presets',
      'custom': 'Custom Prompt',
      'storytime': 'Story Time',
      'parallelself': 'Parallel Self',
      'ghibli-reaction': 'Ghibli Reaction',
      'unreal-reflection': 'Unreal Reflection',
      'custom-prompt': 'Custom Prompt',
      'story-time': 'Story Time',
      'parallel-self': 'Parallel Self'
    }
    
    if (actualType && typeNames[actualType]) {
      return typeNames[actualType]
    }
    
    if (actualPresetKey) {
      return actualPresetKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    
    if (actualType) {
      return actualType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    
    return 'AI'
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <h1 className="text-white text-lg font-semibold">My Gallery</h1>
          
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Tokens */}
          <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
            <span className="text-white text-sm font-medium">{tokenCount} Tokens</span>
          </div>

          {/* Invite */}
          <button
            onClick={async () => {
              try {
                const referralCode = (profileData as any).referralCode || 'STEFNA';
                const shareUrl = `${window.location.origin}?ref=${referralCode}`;
                
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
              } catch (error) {
                console.error('Share failed:', error);
                notifyError({ title: 'Share Failed', message: 'Could not share invite link' });
              }
            }}
            className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors"
          >
            <span className="text-white text-sm font-medium">Invite</span>
          </button>

          {/* Share to Feed Toggle */}
          <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
            <span className="text-white text-sm font-medium">Share to Feed</span>
            <button
              onClick={() => {
                const newValue = !profileData.shareToFeed;
                updateProfile({ shareToFeed: newValue });
                updateUserSettings(newValue);
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                profileData.shareToFeed ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform duration-200 ${
                  profileData.shareToFeed ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="w-full px-4 py-4">
            {/* Masonry Layout */}
            <div className="columns-2 gap-3 space-y-3">
              {userMedia.map((item) => (
                <div key={item.id} className="break-inside-avoid mb-3">
                  {/* Media with overlay tag and action buttons */}
                  <div className="relative group">
                    <div 
                      className="relative cursor-pointer"
                      onClick={() => handleMediaClick(item)}
                    >
                      {item.type === 'video' ? (
                        <video
                          src={item.url}
                          className="w-full h-auto object-cover"
                          controls
                          playsInline
                          muted
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt="Generated content"
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      )}
                      
                      {/* Tag overlay */}
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full border border-white/20 backdrop-blur-sm">
                          {getMediaTypeDisplay(item)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons overlay */}
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(item);
                        }}
                        className="p-2 text-white"
                        title="Share"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                        className="p-2 text-white"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        disabled={deletingMediaIds.has(item.id)}
                        className="p-2 text-red-400 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingMediaIds.has(item.id) ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Empty State */}
            {userMedia.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-white/90 text-lg font-medium mb-2">No media yet</h3>
                <p className="text-white/60 text-sm">Start creating amazing AI art!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Mobile Media Viewer with Navigation */}
      {isViewerOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={() => setIsViewerOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/70 text-white rounded-full backdrop-blur-sm"
          >
            <X size={24} />
          </button>
          
          {/* Previous button */}
          {userMedia.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/70 text-white rounded-full backdrop-blur-sm"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          
          {/* Next button */}
          {userMedia.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/70 text-white rounded-full backdrop-blur-sm"
            >
              <ChevronRight size={24} />
            </button>
          )}
          
          {/* Media */}
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative">
              {selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt="Generated content"
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {/* Tag overlay on media */}
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full border border-white/20 backdrop-blur-sm">
                  {getMediaTypeDisplay(selectedMedia)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
            <button
              onClick={() => handleShare(selectedMedia)}
              className="p-3 text-white"
              title="Share"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={() => handleDownload(selectedMedia)}
              className="p-3 text-white"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => {
                handleDelete(selectedMedia);
                setIsViewerOpen(false);
              }}
              disabled={deletingMediaIds.has(selectedMedia.id)}
              className="p-3 text-red-400 disabled:opacity-50"
              title="Delete"
            >
              {deletingMediaIds.has(selectedMedia.id) ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 size={20} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGalleryScreen;
