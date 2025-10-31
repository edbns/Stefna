import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Share2, ChevronLeft, ChevronRight, X, LogOut } from 'lucide-react';
import userMediaService, { UserMedia } from '../services/userMediaService';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonGrid from '../components/SkeletonGrid';
import { useProfile } from '../contexts/ProfileContext';
import { authenticatedFetch } from '../utils/apiClient';
import { useToasts } from '../components/ui/Toasts';
import { useGenerationEvents, getIsGenerationRunning } from '../lib/generationEvents';
import MobileSidebar from '../components/MobileSidebar';

const toAbsoluteCloudinaryUrl = (maybeUrl: string | undefined, optimize: boolean = false): string | undefined => {
  if (!maybeUrl) return maybeUrl
  
  // If already absolute URL, return as-is (or optimize if it's Cloudinary)
  if (/^https?:\/\//i.test(maybeUrl)) {
    // If it's a Cloudinary URL and we want to optimize it
    if (optimize && maybeUrl.includes('res.cloudinary.com')) {
      // Add optimization parameters before /upload/
      return maybeUrl.replace('/upload/', '/upload/q_auto,f_auto,w_400,c_limit/');
    }
    return maybeUrl;
  }
  
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
  if (!cloud) {
    console.warn('Cloudinary cloud name not configured, returning original URL:', maybeUrl);
    return maybeUrl;
  }
  
  // Clean the URL and construct absolute Cloudinary URL with optimization
  const cleanUrl = maybeUrl.replace(/^\/+/, '');
  const transformation = optimize ? 'q_auto,f_auto,w_400,c_limit/' : '';
  return `https://res.cloudinary.com/${cloud}/image/upload/${transformation}${cleanUrl}`;
}

// Reusable function to transform database media to UserMedia format
const transformDbMediaToUserMedia = (dbMedia: any[]): UserMedia[] => {
  return dbMedia.map((item: any) => {
    // Calculate actual aspect ratio from metadata or use default
    let aspectRatio = 4/3; // Default fallback
    let width = 800;
    let height = 600;
    
    // Try to get actual dimensions from metadata
    if (item.metadata && typeof item.metadata === 'object') {
      const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
      if (metadata.width && metadata.height) {
        width = metadata.width;
        height = metadata.height;
        aspectRatio = width / height;
      }
    }
    
    // For 3D models, use different default dimensions
    if (item.mediaType === '3d' || item.type === '3d') {
      aspectRatio = 1; // Square for 3D models
      width = 600;
      height = 600;
    }
    
    return {
      id: item.id,
      userId: item.userId,
      type: item.mediaType || item.type || 'photo',
      url: toAbsoluteCloudinaryUrl(item.finalUrl) || item.finalUrl,
      prompt: item.prompt || (item.presetKey ? `Generated with ${item.presetKey}` : 'AI Generated Content'),
      aspectRatio,
      width,
      height,
      timestamp: item.createdAt,
      tokensUsed: 2,
      likes: 0,
      isPublic: item.isPublic || false,
      tags: [],
      presetKey: item.presetKey,
      metadata: {
        quality: 'high',
        generationTime: 0,
        modelVersion: '1.0',
        presetKey: item.presetKey,
        presetType: item.type
      },
      cloudinaryPublicId: item.cloudinaryPublicId,
      finalUrl: item.finalUrl
    };
  });
}

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
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  // Infinite scroll state - same as home page
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [lastItemRef, setLastItemRef] = useState<HTMLDivElement | null>(null);
  
  // Use global generation state hook
  const { isRunning: isGenerating } = useGenerationEvents();
  
  // Handle image load
  const handleImageLoad = (mediaId: string) => {
    setLoadedImages(prev => new Set(prev).add(mediaId));
  };
  

  // Load user media and token count
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user ID
        const user = authService.getCurrentUser();
        const userId = user?.id || 'guest-user';
        
        if (!user?.id) {
          console.log('No user ID available for media loading');
          setUserMedia([]);
          setIsLoading(false);
          return;
        }
        
        // Load user media using same API as ProfileScreen with pagination and sorting
        const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${userId}&limit=20&offset=0&sort=created_at&order=desc`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const dbMedia = result.items || [];
          
          console.log('📊 Database returned', dbMedia.length, 'media items');
          
          // Transform database media to UserMedia format using reusable function
          const transformedMedia = transformDbMediaToUserMedia(dbMedia);
          
          setUserMedia(transformedMedia);
          setCurrentOffset(20); // Set next offset
          setHasMoreMedia(dbMedia.length === 20); // If we got less than 20, no more data
        } else {
          console.error('Failed to load user media:', response.status);
          setUserMedia([]);
          setHasMoreMedia(false);
        }
        
        // Load token count
        try {
          const qRes = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' });
          if (qRes.ok) {
            const quotaData = await qRes.json();
            setTokenCount(quotaData.currentBalance || 0);
          }
        } catch (error) {
          console.error('Failed to load token count:', error);
        }
        
        // Load user settings for share to feed toggle
        try {
          const r = await authenticatedFetch('/.netlify/functions/user-settings', { method: 'GET' });
          if (r.ok) {
            const s = await r.json();
            if (s.settings?.share_to_feed !== undefined) {
              updateProfile({ shareToFeed: !!s.settings.share_to_feed });
            }
          }
        } catch (error) {
          console.error('Failed to load user settings:', error);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        setUserMedia([]);
        setHasMoreMedia(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Listen for generation completion to refresh gallery
  useEffect(() => {
    const handleGenerationEnd = (event: any) => {
      console.log('✅ Generation completed - refreshing gallery', event);
      
      // Refresh the gallery to show new media
      setTimeout(() => {
        console.log('🔄 Refreshing gallery after generation completion');
        // Reload user data to get the new media
        const loadUserData = async () => {
          try {
            const user = authService.getCurrentUser();
            if (!user?.id) return;
            
            const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${user.id}&limit=20&offset=0&sort=created_at&order=desc`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
              const result = await response.json();
              const dbMedia = result.items || [];
              
              const transformedMedia = transformDbMediaToUserMedia(dbMedia);
              
              setUserMedia(transformedMedia);
              setCurrentOffset(20);
              setHasMoreMedia(dbMedia.length === 20);
            }
          } catch (error) {
            console.error('Failed to refresh gallery:', error);
          }
        };
        
        loadUserData();
      }, 1000); // Small delay to ensure backend has processed the media
    };

    if (typeof window !== 'undefined') {
      console.log('🎧 Mobile gallery setting up generation:done listener');
      window.addEventListener('generation:done', handleGenerationEnd);
    }

    return () => {
      if (typeof window !== 'undefined') {
        console.log('🧹 Mobile gallery cleaning up generation:done listener');
        window.removeEventListener('generation:done', handleGenerationEnd);
      }
    };
  }, []); // Empty dependency array to run only once

  // Load more media for infinite scroll with race condition protection
  const loadMoreMedia = async () => {
    if (isLoadingMore || !hasMoreMedia) return;
    
    try {
      setIsLoadingMore(true);
      
      const user = authService.getCurrentUser();
      if (!user?.id) return;
      
      // Capture current offset to prevent race conditions
      const currentOffsetValue = currentOffset;
      
      const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${user.id}&limit=20&offset=${currentOffsetValue}&sort=created_at&order=desc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const dbMedia = result.items || [];
        
        if (dbMedia.length === 0) {
          setHasMoreMedia(false);
          return;
        }
        
        // Transform new media using reusable function
        const newMedia = transformDbMediaToUserMedia(dbMedia);
        
        // Use functional updates to prevent race conditions
        setUserMedia(prev => {
          // Check if we already have these items (prevent duplicates)
          const existingIds = new Set(prev.map(item => item.id));
          const newUniqueMedia = newMedia.filter(item => !existingIds.has(item.id));
          return [...prev, ...newUniqueMedia];
        });
        
        setCurrentOffset(prev => prev + dbMedia.length);
        setHasMoreMedia(dbMedia.length === 20);
      }
    } catch (error) {
      console.error('Failed to load more media:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Intersection observer for infinite scroll - same as home page
  useEffect(() => {
    if (!lastItemRef) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreMedia && !isLoadingMore) {
          console.log('👁️ [GalleryScroll] Last item visible, triggering load', {
            hasMoreMedia,
            isLoadingMore,
            mediaLength: userMedia.length
          });
          loadMoreMedia();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(lastItemRef);

    return () => {
      observer.disconnect();
    };
  }, [lastItemRef, hasMoreMedia, isLoadingMore]);

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
      const imageUrl = toAbsoluteCloudinaryUrl(media.url) || media.url;
      
      // Check if user is on iOS/iPhone
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS && navigator.share) {
        // Use Web Share API for iOS to save to Photo Gallery
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `stefna-${media.id}.${media.type === 'video' ? 'mp4' : 'jpg'}`, {
          type: media.type === 'video' ? 'video/mp4' : 'image/jpeg'
        });
        
        await navigator.share({
          title: 'Save to Photos',
          text: `Stefna AI Generated ${media.type === 'video' ? 'Video' : 'Image'}`,
          files: [file],
        });
        
        notifyReady({ title: 'Saved to Photos', message: 'Your media has been saved to your Photo Gallery' });
      } else {
        // Fallback for non-iOS devices or when Web Share API is not available
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `stefna-${media.id}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
        
        link.style.display = 'none';
        link.setAttribute('download', `stefna-${media.id}.${media.type === 'video' ? 'mp4' : 'jpg'}`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(blobUrl);
        
        notifyReady({ title: 'Download Started', message: 'Your media is downloading' });
      }
    } catch (error) {
      console.error('Download failed:', error);
      notifyError({ title: 'Download Failed', message: 'Could not download media' });
    }
  };

  const handleDelete = async (media: UserMedia) => {
    try {
      setDeletingMediaIds(prev => new Set(prev).add(media.id));
      const user = authService.getCurrentUser();
      if (!user?.id) {
        console.error('No user ID available for deletion');
        return;
      }
      await userMediaService.deleteMedia(user.id, media.id);
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
      const imageUrl = toAbsoluteCloudinaryUrl(media.url) || media.url;
      
      if (navigator.share) {
        // Fetch the image as a blob for sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `stefna-${media.id}.${media.type === 'video' ? 'mp4' : 'jpg'}`, {
          type: media.type === 'video' ? 'video/mp4' : 'image/jpeg'
        });
        
        // Use native share API with the actual file
        await navigator.share({
          title: 'Check out my AI creation!',
          text: `Created with Stefna AI - ${getMediaTypeDisplay(media)}`,
          files: [file],
        });
      } else {
        // No fallback - just show error if sharing is not supported
        notifyError({ title: 'Share Not Supported', message: 'Your device does not support sharing files' });
      }
    } catch (error) {
      console.error('Share failed:', error);
      notifyError({ title: 'Share Failed', message: 'Could not share media' });
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
      'cyber_siren': 'Cyber Siren',
      'ghibli_reaction': 'Ghibli Reaction',
      'unreal_reflection': 'Unreal Reflection',
      'presets': 'Presets',
      'custom_prompt': 'Custom Prompt',
      'story_time': 'Story Time',
      'story': 'Story Time',
      'edit': 'Studio',
      'parallel_self': 'Parallel Self',
      'cyber-siren': 'Cyber Siren',
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
      {/* Sticky Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
        aria-label="Go back"
      >
        <ArrowLeft size={20} className="text-black" />
      </button>

      {/* Stats Row - REMOVED: Token, Invite, and Share to Feed moved to sidebar */}

      {/* Content */}
      <div className="pb-20 pt-16">
        {isLoading ? (
          <div className="px-4 py-4">
            <SkeletonGrid columns={3} rows={10} />
          </div>
        ) : (
          <div className="w-full px-4 py-4">
            {/* Generation loading overlay */}
            {isGenerating && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div className="bg-black/90 p-8 flex flex-col items-center max-w-sm mx-4">
                  <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mb-6"></div>
                  <h3 className="text-white text-lg font-semibold mb-2">Creating Your Media</h3>
                  <p className="text-white/80 text-sm text-center">Please wait while we process your request...</p>
                  <div className="mt-4 w-full bg-white/20 rounded-full h-1 overflow-hidden">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-[3000ms] ease-out" 
                      style={{ 
                        width: '0%',
                        animation: 'progressFill 8s ease-out forwards'
                      }}
                    ></div>
                  </div>
                  <p className="text-green-500 text-xs text-center mt-4">
                    AI can make mistakes, Please double check it.
                  </p>
                </div>
              </div>
            )}
            
            {/* Three-column grid layout */}
            <div className="grid grid-cols-3 gap-1">
              {userMedia.map((item, index) => (
                <div 
                  key={item.id} 
                  className="relative"
                  ref={index === userMedia.length - 1 ? setLastItemRef : null}
                >
                  {/* Media with overlay tag and action buttons */}
                  <div className="relative group">
                    <div 
                      className="relative cursor-pointer aspect-square overflow-hidden bg-white/5"
                      onClick={() => handleMediaClick(item)}
                    >
                      {/* Loading skeleton */}
                      {!loadedImages.has(item.id) && (
                        <div className="absolute inset-0 bg-white/5 animate-pulse" />
                      )}
                      
                      {item.type === 'video' ? (
                        <video
                          src={toAbsoluteCloudinaryUrl(item.url, true) || item.url}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                          muted
                          onLoadedData={() => handleImageLoad(item.id)}
                        />
                      ) : (
                        <img
                          src={toAbsoluteCloudinaryUrl(item.url, true) || item.url}
                          alt="Generated content"
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoad={() => handleImageLoad(item.id)}
                          onError={(e) => {
                            // Handle broken images by showing placeholder
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            handleImageLoad(item.id);
                            
                            // Create placeholder div
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-full h-full bg-white/10 flex items-center justify-center';
                            placeholder.innerHTML = `
                              <div class="text-center text-white/40">
                                <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <div class="text-xs">Image unavailable</div>
                              </div>
                            `;
                            
                            // Insert placeholder after the broken image
                            img.parentNode?.insertBefore(placeholder, img.nextSibling);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Loading indicator for infinite scroll - only show when loading more */}
            {isLoadingMore && hasMoreMedia && (
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-2 text-white/60">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm">Loading more...</span>
                </div>
              </div>
            )}
            
            {/* End of media indicator */}
            {!hasMoreMedia && userMedia.length > 0 && (
              <div className="text-center py-8 text-white/40 text-sm">
                You've reached the end of your gallery
              </div>
            )}
            
            {/* Empty State */}
            {userMedia.length === 0 && !isLoading && (
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
                  src={toAbsoluteCloudinaryUrl(selectedMedia.url) || selectedMedia.url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={toAbsoluteCloudinaryUrl(selectedMedia.url) || selectedMedia.url}
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
