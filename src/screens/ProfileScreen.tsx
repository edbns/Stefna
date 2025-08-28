import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Heart, FileText, Bell, Settings, Shield, Cookie, ArrowLeft, LogOut, X, User, Globe, ChevronRight, Coins, Users, Plus } from 'lucide-react'
import { InstagramIcon, XIcon, FacebookIcon, TikTokIcon, ThreadsIcon, YouTubeIcon } from '../components/SocialIcons'
// RemixIcon import removed - no more remix functionality
import MasonryMediaGrid from '../components/MasonryMediaGrid'
import DraftMediaGrid from '../components/DraftMediaGrid'
import { navigateToEditor } from '../utils/editorNavigation'
import FullScreenMediaViewer from '../components/FullScreenMediaViewer'
import userMediaService, { UserMedia } from '../services/userMediaService'
import authService from '../services/authService'
import ConfirmModal from '../components/ConfirmModal'
import tokenService from '../services/tokenService'
import { authenticatedFetch } from '../utils/apiClient'
import { useToasts } from '../components/ui/Toasts'
import ProfileIcon from '../components/ProfileIcon'

import userService from '../services/userService'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'
import { ensureAndUpdateProfile } from '../services/profile'
import { useProfile } from '../contexts/ProfileContext'

const toAbsoluteCloudinaryUrl = (maybeUrl: string | undefined): string | undefined => {
  if (!maybeUrl) return maybeUrl
  // Keep absolute http(s) and data/blob URLs as-is
  if (/^https?:\/\//i.test(maybeUrl) || /^(data:|blob:)/i.test(maybeUrl)) return maybeUrl
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloud) return maybeUrl
  return `https://res.cloudinary.com/${cloud}/image/upload/${maybeUrl.replace(/^\/+/, '')}`
}

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate()
  const { notifyReady, notifyError } = useToasts()
  // const location = useLocation()
  const [activeTab, setActiveTab] = useState<string>('all-media')
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Upload functionality
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  // Use profile context
  const { profileData, updateProfile, refreshProfile } = useProfile()
  
  // Upload handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📁 File selected:', { name: file.name, size: file.size, type: file.type })

    // Create preview URL for display only
    const preview = URL.createObjectURL(file)
    console.log('🖼️ Preview URL created:', preview)

    // Store both: File for upload, preview URL for display
    setSelectedFile(file)
    setPreviewUrl(preview)
    
    // Navigate to home page with file data
    navigate('/', { 
      state: { 
        selectedFile: file,
        previewUrl: preview,
        openComposer: true 
      }
    })
  }
  
  // Local state for editing (synced with context)
  const [editingProfileData, setEditingProfileData] = useState({
    name: profileData.name,
    avatar: profileData.avatar,
    shareToFeed: profileData.shareToFeed
  })
  
  // Sync editing state when profile context changes
  useEffect(() => {
    setEditingProfileData({
      name: profileData.name,
      avatar: profileData.avatar,
      shareToFeed: profileData.shareToFeed
    })
  }, [profileData])

  // Handle navigation state for activeTab
  useEffect(() => {
    const state = (navigate as any).location?.state
    if (state?.activeTab) {
      setActiveTab(state.activeTab)
    }
  }, [navigate])

  // Handle invite modal opening from ProfileTokenDisplay
  useEffect(() => {
    const handleOpenInviteModal = () => {
  
    }

    window.addEventListener('openInviteModal', handleOpenInviteModal)
    return () => {
      window.removeEventListener('openInviteModal', handleOpenInviteModal)
    }
  }, [])

  // Handle user media updates (after saves)
  useEffect(() => {
    const handleUserMediaUpdated = () => {
      console.log('🔄 User media updated event received, refreshing profile media...')
      loadProfileFromDatabase()
    }

    window.addEventListener('userMediaUpdated', handleUserMediaUpdated)
    return () => {
      window.removeEventListener('userMediaUpdated', handleUserMediaUpdated)
    }
  }, [])

  // Fallback to localStorage when profile loading fails
  const fallbackToLocalStorage = () => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile)
        updateProfile(parsedProfile)
        
        // Sync preview photo with saved avatar
        if (parsedProfile.avatar && typeof parsedProfile.avatar === 'string') {
          setPreviewPhoto(parsedProfile.avatar)
        }
      } catch (error) {
        console.error('Failed to load profile data from localStorage:', error)
      }
    }
  };

  // Load profile data from database and localStorage
  const loadProfileFromDatabase = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      console.log('🔄 Loading profile from database...')
      const response = await fetch('/.netlify/functions/get-user-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Profile loaded from database:', result)
        
        // Handle new response format: { ok: true, profile: {...} }
        const userData = result.ok && result.profile ? result.profile : result;
        
        // Store the real user ID from the database response
        if (userData.id) {
          setCurrentUserId(userData.id);
          console.log('✅ Set current user ID from profile:', userData.id);
        }
        
        const profileData = {
          name: userData.name || userData.username || '',
          bio: userData.bio || 'AI artist exploring the boundaries of creativity 🎨',
          avatar: userData.avatar || userData.avatar_url || ''  // Support both field names
        }
        
        updateProfile(profileData)
        
        // Sync preview photo with loaded avatar
        if (userData.avatar) {
          setPreviewPhoto(userData.avatar)
        }
        
        // Also update localStorage for consistency and offline access
        localStorage.setItem('userProfile', JSON.stringify(profileData))
      } else {
        console.warn('⚠️ Failed to load profile from database, falling back to JWT token parsing')
        
        // Frontend safety net: parse JWT client-side to grab user ID
        try {
          const token = authService.getToken();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            const ownerId = payload.sub || payload.user_id || payload.userId || payload.uid || payload.id;
            
            if (ownerId) {
              console.log('✅ Extracted user ID from JWT token:', ownerId);
              setCurrentUserId(ownerId);
              
              // Create a minimal profile from JWT data
              const fallbackProfile = {
                name: payload.name || payload.username || `user-${ownerId.slice(-6)}`,
                bio: 'AI artist exploring the boundaries of creativity 🎨',
                avatar: payload.avatar_url || payload.picture || ''
              };
              
              updateProfile(fallbackProfile);
              localStorage.setItem('userProfile', JSON.stringify(fallbackProfile));
              
              console.log('✅ Created fallback profile from JWT:', fallbackProfile);
            } else {
              console.warn('⚠️ JWT token missing user ID, falling back to localStorage');
              fallbackToLocalStorage();
            }
          } else {
            console.warn('⚠️ No JWT token, falling back to localStorage');
            fallbackToLocalStorage();
          }
        } catch (jwtError) {
          console.error('❌ Failed to parse JWT token:', jwtError);
          fallbackToLocalStorage();
        }
      }
    } catch (error) {
      console.error('❌ Failed to load profile from database:', error)
      // Fallback to localStorage on error
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          updateProfile(parsedProfile)
          
          // Sync preview photo with saved avatar
          if (parsedProfile.avatar && typeof parsedProfile.avatar === 'string') {
            setPreviewPhoto(parsedProfile.avatar)
          }
        } catch (parseError) {
          console.error('Failed to load profile data from localStorage:', parseError)
        }
      }
    }
  }

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [userMedia, setUserMedia] = useState<UserMedia[]>([])
  const [draftMedia, setDraftMedia] = useState<UserMedia[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerMedia, setViewerMedia] = useState<UserMedia[]>([])
  const [viewerStartIndex, setViewerStartIndex] = useState(0)
  const [confirm, setConfirm] = useState<{ open: boolean; media?: UserMedia }>({ open: false })
  // Removed tier system - all users get same experience
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string>('')
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Load profile data when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Load profile first, then media (profile sets currentUserId)
      loadProfileFromDatabase().then(() => {
        // Only load media after profile is loaded and currentUserId is set
        if (currentUserId && currentUserId !== 'guest-user') {
          console.log('✅ Profile loaded, now loading user media for:', currentUserId);
          loadUserMedia();
        } else {
          // Fallback: if profile didn't set currentUserId, try to load media anyway
          console.log('⚠️ Profile loaded but no currentUserId set, trying to load media anyway');
          setTimeout(() => loadUserMedia(), 100);
        }
      });
      
      // Load persisted user settings (shareToFeed)
      ;(async () => {
        try {
          const token = authService.getToken()
          if (!token) return
          const r = await authenticatedFetch('/.netlify/functions/user-settings', { method: 'GET' })
          if (r.ok) {
            const s = await r.json()
            updateProfile({ shareToFeed: !!s.shareToFeed })
          }
        } catch (e) {
          // ignore, fallback to defaults/localStorage
        }
      })()
    } else {
      // Fallback to localStorage for non-authenticated users
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          updateProfile(parsedProfile)
        } catch (error) {
          console.error('Failed to load profile data from localStorage:', error)
        }
      }
    }
  }, [isAuthenticated])
  const [referralStats, setReferralStats] = useState<{ invites: number; tokensEarned: number; referralCode: string } | null>(null)
  // const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [showAdminUpgrade, setShowAdminUpgrade] = useState(false)


  // Unified notification system (same as home page)
  const [notifications, setNotifications] = useState<Array<{
    id: number
    title: string
    message: string
    type: 'success' | 'info' | 'warning' | 'error' | 'processing' | 'complete' | 'system'
    timestamp: string
    mediaUrl?: string
    mediaType?: 'image' | 'video'
    persistent?: boolean
  }>>([])

  

  // Media selection state for bulk operations
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)



  // Media selection helper functions
  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId)
      } else {
        newSet.add(mediaId)
      }
      return newSet
    })
  }

  const selectAllMedia = () => {
    const allIds = new Set(userMedia.map(media => media.id))
    setSelectedMediaIds(allIds)
  }

  const deselectAllMedia = () => {
    setSelectedMediaIds(new Set())
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev)
    if (isSelectionMode) {
      setSelectedMediaIds(new Set()) // Clear selection when exiting
    }
  }

  // Add loading state for delete operations
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  
  // Enhanced delete states for better UX
  const [deletingMediaIds, setDeletingMediaIds] = useState<Set<string>>(new Set())
  const [deletedMediaIds, setDeletedMediaIds] = useState<Set<string>>(new Set())

  // Add delete all functionality
  const deleteAllMedia = async () => {
    if (userMedia.length === 0) return

    try {
      const token = authService.getToken()
      if (!token) {
        addNotification('Delete Failed', 'Authentication required', 'error')
        return
      }

      // Show confirmation modal for delete all
      setConfirm({ 
        open: true, 
        media: { 
          id: 'delete-all', 
          userId: '', 
          type: 'photo', 
          url: '', 
          prompt: '', 
          aspectRatio: 1, 
          width: 0, 
          height: 0, 
          timestamp: '', 
          tokensUsed: 0, 
          likes: 0, 
          remixCount: 0, 
          isPublic: false, 
          tags: [], 
          metadata: { quality: 'standard', generationTime: 0, modelVersion: '1.0' }
        } as UserMedia 
      })
    } catch (error) {
      console.error('❌ Delete all error:', error)
      addNotification('Delete Failed', 'Network or server error', 'error')
    }
  }

  // Handle delete all functionality
  const handleConfirmDeleteAll = async () => {
    if (userMedia.length === 0) return
    
    setIsDeletingAll(true)
    
    // Add all media to deleting state for visual feedback
    const allMediaIds = new Set(userMedia.map(m => m.id))
    setDeletingMediaIds(allMediaIds)
    
    try {
      // Delete all media items
      const deletePromises = userMedia.map(async (media) => {
        const token = authService.getToken()
        if (!token) throw new Error('Authentication required')
        
        const response = await fetch('/.netlify/functions/delete-media', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            mediaId: media.id,
            userId: currentUserId || authService.getCurrentUser()?.id || ''
          })
        })
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.message || `Failed to delete media ${media.id}`)
        }
        
        return { success: true, mediaId: media.id }
      })
      
      const results = await Promise.allSettled(deletePromises)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.length - successful

      if (successful > 0) {
        // Add successful deletions to deleted state
        const successfulIds = results
          .filter(r => r.status === 'fulfilled' && r.value.success)
          .map(r => (r as any).value.mediaId)
        setDeletedMediaIds(prev => new Set([...prev, ...successfulIds]))
        
        // Clear all media from local state immediately for instant UI feedback
        setUserMedia([])
        setDraftMedia([])
        
        addNotification(
          'Delete All Complete', 
          `Successfully deleted ${successful} media items${failed > 0 ? `, ${failed} failed` : ''}`, 
          'success'
        )
        
        // Background refresh to ensure database sync
        setTimeout(() => {
          loadUserMedia().catch(error => {
            console.warn('Background refresh failed:', error)
          })
        }, 500)
      } else {
        addNotification('Delete Failed', 'No media items were deleted', 'error')
      }
    } catch (error) {
      console.error('❌ Delete all error:', error)
      addNotification('Delete Failed', error instanceof Error ? error.message : 'Network or server error', 'error')
    } finally {
      setIsDeletingAll(false)
      setDeletingMediaIds(new Set())
      setConfirm({ open: false, media: null })
    }
  }

  const deleteSelectedMedia = async () => {
    if (selectedMediaIds.size === 0) return

    try {
      const token = authService.getToken()
      if (!token) {
        addNotification('Delete Failed', 'Authentication required', 'error')
        return
      }

      // Show confirmation modal for bulk delete
      setConfirm({ 
        open: true, 
        media: { 
          id: 'bulk-delete', 
          userId: '', 
          type: 'photo', 
          url: '', 
          prompt: '', 
          aspectRatio: 1, 
          width: 0, 
          height: 0, 
          timestamp: '', 
          tokensUsed: 0, 
          likes: 0, 
          remixCount: 0, 
          isPublic: false, 
          tags: [], 
          metadata: { quality: 'standard', generationTime: 0, modelVersion: '1.0' }
        } as UserMedia 
      })
    } catch (error) {
      console.error('❌ Bulk delete error:', error)
      addNotification('Delete Failed', 'Network or server error', 'error')
    }
  }

  // Enhanced delete selected with loading state
  const handleConfirmDeleteSelected = async () => {
    if (selectedMediaIds.size === 0) return
    
    setIsDeletingSelected(true)
    
    // Add all selected media to deleting state for visual feedback
    setDeletingMediaIds(new Set(selectedMediaIds))
    
    try {
      // Delete each selected media item
      const deletePromises = Array.from(selectedMediaIds).map(async (mediaId) => {
        const token = authService.getToken()
        if (!token) throw new Error('Authentication required')
        
        const response = await fetch('/.netlify/functions/delete-media', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            mediaId,
            userId: currentUserId || authService.getCurrentUser()?.id || ''
          })
        })
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.message || `Failed to delete media ${mediaId}`)
        }
        
        return mediaId
      })
      
      const results = await Promise.allSettled(deletePromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.length - successful
      
      if (successful > 0) {
        // Add successful deletions to deleted state
        const successfulIds = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as any).value)
        setDeletedMediaIds(prev => new Set([...prev, ...successfulIds]))
        
        // Remove from user media immediately for instant UI feedback
        setUserMedia(prev => prev.filter(item => !selectedMediaIds.has(item.id)))
        
        addNotification('Delete Successful', `Deleted ${successful} media items${failed > 0 ? `, ${failed} failed` : ''}`, 'success')
      } else {
        addNotification('Delete Failed', 'No media items were deleted', 'error')
      }
      
      // Clear selection and exit selection mode
      setSelectedMediaIds(new Set())
      setIsSelectionMode(false)
      
      // Background refresh to ensure database sync
      setTimeout(() => {
        loadUserMedia().catch(error => {
          console.warn('Background refresh failed:', error)
        })
      }, 500)
      
    } catch (error) {
      console.error('❌ Bulk delete error:', error)
      addNotification('Delete Failed', error instanceof Error ? error.message : 'Network or server error', 'error')
    } finally {
      setIsDeletingSelected(false)
      setDeletingMediaIds(new Set())
      setConfirm({ open: false, media: null })
    }
  }

  // Load user media from database using new Netlify Function
  const loadUserMedia = async () => {
    try {
      // Get current user ID from auth service or use stored ID from profile
      const user = authService.getCurrentUser()
      const userId = currentUserId || user?.id || 'guest-user'
      
      // If we have a stored currentUserId, use that (it comes from profile loading)
      if (currentUserId && currentUserId !== 'guest-user') {
        console.log('✅ Using stored currentUserId for media loading:', currentUserId);
      } else if (user?.id) {
        setCurrentUserId(user.id);
        console.log('✅ Set currentUserId from auth service:', user.id);
      }
      
      // Set authentication status and user tier
      if (user) {
        setIsAuthenticated(true)
        // Map user tier from auth service
            // Removed tier system - all users get same experience
        
        // Load referral stats for authenticated users
        try {
          // Load referral stats from real database
          try {
            const referralRes = await authenticatedFetch('/.netlify/functions/get-referral-stats', { method: 'GET' })
            if (referralRes.ok) {
              const stats = await referralRes.json()
              setReferralStats({
                invites: stats.referred_count,
                tokensEarned: stats.credits_from_referrals,
                referralCode: '' // No codes needed for email-based referrals
              })
            } else {
              // Fallback to client service
              const stats = await tokenService.getInstance().getReferralStats(userId)
              setReferralStats(stats)
            }
          } catch {
            // Fallback to client service
            const stats = await tokenService.getInstance().getReferralStats(userId)
            setReferralStats(stats)
          }
          
          // Load token count - simplified for new credits system
          // Prefer server-side quota for accuracy
          try {
            const qRes = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' })
            if (qRes.ok) {
              const q = await qRes.json()
              setTokenCount((q.daily_limit || 0) - (q.daily_used || 0))
            } else {
              // Fallback to client service
              const tokenUsage = await tokenService.getInstance().getUserUsage(userId)
              setTokenCount(tokenUsage.dailyLimit - tokenUsage.dailyUsage)
            }
          } catch {
            const tokenUsage = await tokenService.getInstance().getUserUsage(userId)
            setTokenCount(tokenUsage.dailyLimit - tokenUsage.dailyUsage)
          }
        } catch (error) {
          console.error('Failed to load referral stats or token count:', error)
          // Simplified: all users get same daily limit (30)
          setTokenCount(30)
        }
      } else {
        setIsAuthenticated(false)
        // Removed tier system - all users get same experience
      }

      // Load all user media from database using new Netlify Function
      try {
        const jwt = authService.getToken() || localStorage.getItem('auth_token');
        
        if (!jwt) {
          // Guest user: skip server fetch, show local results only
          console.log('Guest user: skipping getUserMedia server call');
          const allMedia = await userMediaService.getAllUserMedia(userId);
          setUserMedia(allMedia);
        } else {
          // Authenticated user: fetch from server with JWT
          const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${userId}&limit=50`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.status === 401) {
            // JWT expired/invalid: fallback to local
            console.log('JWT invalid: falling back to local media');
            const allMedia = await userMediaService.getAllUserMedia(userId);
            setUserMedia(allMedia);
          } else if (response.ok) {
            const result = await response.json();
            const dbMedia = result.items || []; // Updated to use 'items' instead of 'media'
            
            console.log('📊 Database returned', dbMedia.length, 'media items');
            
            // Transform database media to UserMedia format
            const transformedMedia: UserMedia[] = dbMedia.map((item: any) => {
              console.log(`🔍 Database item ${item.id}:`, { 
                prompt: item.prompt, 
                mode: item.mode, 
                meta: item.meta 
              });
              
              return {
                id: item.id,
                userId: item.userId,
                type: item.mediaType === 'video' ? 'video' : 'photo',
                url: toAbsoluteCloudinaryUrl(item.finalUrl) || item.finalUrl,
                prompt: item.prompt || 'AI Generated Content',
                aspectRatio: 4/3, // Default aspect ratio
                width: 800,
                height: 600,
                timestamp: item.createdAt,
                tokensUsed: 2, // Default token usage
                likes: 0, // Will be updated when we implement likes
                remixCount: 0, // Will be updated when we implement remix counts
                isPublic: item.isPublic || false,
                tags: [],
                metadata: {
                  quality: 'high',
                  generationTime: 0,
                  modelVersion: '1.0'
                }
              };
            });
            
            console.log('📊 Setting userMedia with', transformedMedia.length, 'items')
            setUserMedia(transformedMedia);
            
                    // Remix functionality removed - no more remix processing
          } else {
            console.error('Failed to load user media from database:', response.statusText);
            // Fallback to local service if database fails
            const allMedia = await userMediaService.getAllUserMedia(userId);
            console.log('📊 Fallback: Setting userMedia with', allMedia.length, 'items from local service')
            setUserMedia(allMedia);
          }
        }
      } catch (error) {
        console.error('Error loading user media:', error);
        // Fallback to local service on any error
        try {
          const allMedia = await userMediaService.getAllUserMedia(userId);
          setUserMedia(allMedia);
        } catch (fallbackError) {
          console.error('Fallback media loading also failed:', fallbackError);
          setUserMedia([]);
        }
      } finally {
        // Always clear loading state
        setIsLoading(false);
      }

      // Remix functionality removed - no more remix processing
      
      // Load draft media (empty for now - will be populated when users create drafts)
      setDraftMedia([])
      
      // Load drafts from localStorage
      try {
        const user = authService.getCurrentUser()
        if (user?.id) {
          const key = `user_drafts_${user.id}`
          const savedDrafts = localStorage.getItem(key)
          if (savedDrafts) {
            const drafts = JSON.parse(savedDrafts)
            console.log('📝 Loaded drafts from localStorage:', drafts.length)
            setDraftMedia(drafts)
          }
        }
      } catch (error) {
        console.error('Failed to load drafts from localStorage:', error)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load user media:', error)
      setIsLoading(false)
    }
  }

  // Load user media on component mount and when updated
  useEffect(() => {
    loadUserMedia()
    
    // Listen for user media updates from other components
    const handleUserMediaUpdated = (e: any) => {
      console.log('🔄 ProfileScreen received userMediaUpdated event, refreshing...')
      // If an optimistic item is provided, prepend it immediately
      const optimistic = e?.detail?.optimistic as UserMedia | undefined
      if (optimistic) {
        setUserMedia(prev => [optimistic, ...prev])
      }
      const markFailedId = e?.detail?.markFailedId as string | undefined
      if (markFailedId) {
        setUserMedia(prev => prev.map(m => (m.id === markFailedId ? { ...m, status: 'failed' } : m)))
      }
      const removeId = e?.detail?.removeId as string | undefined
      if (removeId) {
        setUserMedia(prev => prev.filter(m => m.id !== removeId))
      }
      loadUserMedia()
      
      // Also refresh drafts specifically
      const user = authService.getCurrentUser()
      if (user?.id) {
        const key = `user_drafts_${user.id}`
        const savedDrafts = localStorage.getItem(key)
        if (savedDrafts) {
          const drafts = JSON.parse(savedDrafts)
          console.log('📝 Refreshing drafts from localStorage:', drafts.length)
          setDraftMedia(drafts)
        }
      }
    }
    
    window.addEventListener('userMediaUpdated', handleUserMediaUpdated as any)
    
    return () => {
      window.removeEventListener('userMediaUpdated', handleUserMediaUpdated as any)
    }
  }, [])
  
  // Monitor activeTab changes to ensure media is properly loaded
  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab)
    console.log('📊 Current media state:', {
      userMedia: userMedia.length,
      isLoading
    })
  }, [activeTab, userMedia.length, isLoading])

  // Monitor userMedia state changes for debugging
  useEffect(() => {
    console.log('🔄 userMedia state updated:', userMedia.length, 'items')
    if (userMedia.length > 0) {
      console.log('🔍 First media item:', {
        id: userMedia[0].id,
        type: userMedia[0].type,
        url: userMedia[0].url?.substring(0, 50) + '...'
      })
    }
  }, [userMedia])









  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setEditingProfileData(prev => ({ ...prev, avatar: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const profileDataToSave = { ...editingProfileData }
      let avatarUrl: string | undefined = undefined
      
      // Handle avatar upload if it's a file
      if (editingProfileData.avatar instanceof File) {
        // Use the existing uploadToCloudinary function which handles signing correctly
        const up = await uploadToCloudinary(editingProfileData.avatar, 'users')
        avatarUrl = up.secure_url
        profileDataToSave.avatar = avatarUrl
      } else if (typeof editingProfileData.avatar === 'string') {
        avatarUrl = editingProfileData.avatar
      }

      // Use the new profile service to update
      await ensureAndUpdateProfile({
        username: profileDataToSave.name, // Map name to username for now
        avatar_url: avatarUrl,
        share_to_feed: profileDataToSave.shareToFeed,

      })

      // Update the profile context - this will trigger updates across all components
      updateProfile(profileDataToSave)
      
      // Update the preview photo state
      if (avatarUrl) {
        setPreviewPhoto(avatarUrl)
      }
      
      notifyReady({ title: 'Profile Updated', message: 'Your profile has been saved successfully' })
      setShowEditProfileModal(false)
    } catch (e: any) {
      console.error('Save profile failed:', e)
      notifyError({ 
        title: 'Update failed', 
        message: e.message || 'Could not update profile' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    // Clear all user data
    localStorage.removeItem('userProfile')
    localStorage.removeItem('token_usage')
    localStorage.removeItem('token_generations')
    localStorage.removeItem('referral_codes')
    
    // Clear auth state
    authService.logout()
    
    addNotification('Account Deleted', 'Your account has been permanently deleted', 'info')
    setShowDeleteAccountModal(false)
    
    // Redirect to home page after deletion
    setTimeout(() => {
    navigate('/')
    }, 1000)
  }

  // Media interaction handlers
  const handleMediaClick = (media: UserMedia) => {
    // Don't open full-screen viewer for draft tab
    if (activeTab === 'draft') {
      return
    }
    
    const active = activeTab === 'draft' ? draftMedia : userMedia
    const index = active.findIndex(m => m.id === media.id)
    setViewerMedia(active)
    setViewerStartIndex(Math.max(0, index))
    setViewerOpen(true)
  }

  const handleDownload = async (media: UserMedia) => {
    try {
      console.log('🔍 [Download] Starting download for media:', {
        id: media.id,
        type: media.type,
        url: media.url,
        urlType: media.url?.includes('replicate.delivery') ? 'replicate' : 'other'
      });

      // Check if this is a Replicate URL (Neo Tokyo Glitch)
      if (media.url?.includes('replicate.delivery')) {
        console.log('🎭 [Download] Neo Tokyo Glitch/Replicate URL detected, using direct download');
        
        // For Replicate URLs, try direct download without CORS fetch
        const link = document.createElement('a');
        link.href = media.url;
        const ext = media.type === 'video' ? 'mp4' : 'jpg';
        link.download = `stefna-${media.id}.${ext}`;
        link.target = '_blank'; // Open in new tab if direct download fails
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ [Download] Neo Tokyo Glitch direct download initiated');
        return;
      }

      // For other URLs (Cloudinary, etc.), use the original CORS fetch method
      console.log('🔍 [Download] Using CORS fetch for non-Replicate URL');
      const resp = await fetch(media.url, { mode: 'cors' });
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = media.type === 'video' ? 'mp4' : 'jpg';
      link.download = `stefna-${media.id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ [Download] CORS fetch download completed successfully');
    } catch (e) {
      console.error('❌ [Download] Download failed:', e);
      addNotification('Download failed', 'Unable to download file', 'error');
    }
  }

  // Simple share function that copies media URL to clipboard
  const handleShare = async (media: UserMedia) => {
    try {
      // Auth guard: require JWT before attempting to share
      if (!authService.getToken()) {
        addNotification('Login Required', 'Please sign in to share media', 'warning')
        navigate('/auth')
        return
      }

      // Copy media URL to clipboard
      await navigator.clipboard.writeText(media.url)
      addNotification('Link Copied', 'Media link copied to clipboard!', 'success')
      
    } catch (error) {
      console.error('Failed to copy media link:', error)
      addNotification('Share Failed', 'Failed to copy link. Please try again.', 'error')
    }
  }

  // Handle unsharing media (making it private)
  const handleUnshare = async (media: UserMedia) => {
    try {
      // Auth guard: require JWT before attempting to change visibility
      if (!authService.getToken()) {
        addNotification('Login Required', 'Please sign in to change visibility', 'warning')
        navigate('/auth')
        return
      }

      // Update media visibility in database using recordShare
      const response = await authenticatedFetch('/.netlify/functions/recordShare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_id: media.id,
          shareToFeed: false  // 🔒 PRIVACY FIRST: Default to private
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Unshare successful:', result)
        
        // Update local state with server response
        setUserMedia(prev => prev.map(item => 
          item.id === media.id 
            ? { 
                ...item, 
                visibility: result.asset.visibility,
                env: result.asset.env
              }
            : item
        ))
        
        addNotification('Media Unshared', 'Your media is now private!', 'success')
      } else {
        const error = await response.json()
        addNotification('Unshare Failed', error.error || 'Failed to unshare media', 'error')
      }
    } catch (error) {
      console.error('Failed to unshare media:', error)
      addNotification('Unshare Failed', 'Failed to unshare media. Please try again.', 'error')
    }
  }

  // Unified notification functions (same as home page)
  // Notifications disabled - replaced with no-op function
  // Notifications disabled - replaced with no-op function
  const addNotification = (title: string, message?: string, type: 'success' | 'info' | 'warning' | 'error' | 'processing' | 'complete' | 'system' = 'info', mediaUrl?: string, mediaType?: 'image' | 'video', persistent?: boolean) => {
    // Notifications are disabled on profile page - only show on home page
    console.log(`[NOTIFICATION DISABLED] ${type.toUpperCase()}: ${title} - ${message}`)
  }

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }





  // Deletion handled in specific grid handlers
  const [isDeleting, setIsDeleting] = useState<string | null>(null) // Track which media is being deleted
  
  const handleDeleteMedia = (media: UserMedia) => {
    setConfirm({ open: true, media })
  }

  const handleEditDraft = (media: UserMedia) => {
    navigateToEditor(navigate, media.url, media.prompt)
  }

  const handleDeleteDraft = (media: UserMedia) => {
    setConfirm({ open: true, media })
  }



  // Invite Friends functionality
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setInviteError('Please enter an email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Please enter a valid email address')
      return
    }

    setIsSendingInvite(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      // Import emailService dynamically to avoid circular dependencies
      const emailService = (await import('../services/emailService')).default
      
      const result = await emailService.sendReferralEmail({
        referrerEmail: authService.getCurrentUser()?.email || '',
        referrerName: profileData.name,
        friendEmail: inviteEmail.trim(),
        referralCode: referralStats?.referralCode
      })

      if (result.success) {
        setInviteSuccess('Invitation sent successfully!')
        setInviteEmail('')
        
        // Update referral stats
        if (referralStats) {
          const updatedStats = { ...referralStats, invites: referralStats.invites + 1 }
          setReferralStats(updatedStats)
        }
        
        addNotification('Invitation Sent', 'Your friend will receive an email invitation shortly', 'success')
      } else {
        setInviteError(result.error || 'Failed to send invitation')
        addNotification('Invitation Failed', result.error || 'Failed to send invitation', 'error')
      }
    } catch (error) {
      console.error('Failed to send invite:', error)
      setInviteError('Failed to send invitation. Please try again.')
      addNotification('Invitation Failed', 'Failed to send invitation. Please try again.', 'error')
    } finally {
      setIsSendingInvite(false)
    }
  }

  const sidebarItems = [
    { id: 'tokens', label: 'Tokens', icon: Coins },
    { id: 'invite-friends', label: 'Invite Friends', icon: Users },
    
    { id: 'divider_prefs', type: 'divider', label: ' ' },
    { id: 'pref_share', label: 'Share to Feed', type: 'toggle', setting: 'autoShareToFeed' },
    // Remix preference removed - focus on personal creativity
    { id: 'divider_media', type: 'divider', label: ' ' },
    { id: 'all-media', label: 'All Media', icon: Image },
    // Remixes tab removed - no more remix functionality
    { id: 'draft', label: 'Drafts', icon: FileText },
    { id: 'account', label: 'Account', icon: Settings }
  ]

  // Persist user settings helper
  const updateUserSettings = async (shareToFeed: boolean) => {
    const token = authService.getToken()
    if (!token) return
    try {
      const r = await authenticatedFetch('/.netlify/functions/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToFeed })
      })
      if (r.ok) {
        const s = await r.json()
        updateProfile({ shareToFeed: !!s.shareToFeed })
      }
    } catch (e) {
      // keep local state; will retry next time
    }
  }

  return (
    <div className="min-h-screen bg-glossy-black-950 flex">
      {/* Sidebar - 20% */}
              <div className="w-[20%] bg-black p-4 pt-20 relative sticky top-0 h-screen overflow-y-auto flex flex-col">
        {/* Back Arrow - Top Left */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors duration-300"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>



        {/* All Navigation Items in One Block */}
        <div className="flex-1">
          <div className="space-y-1">






            {/* Navigation Tabs */}
            {sidebarItems.map((item) => {
              // Handle dividers
              if (item.type === 'divider') {
                return <div key={item.id} className="h-px bg-white/10 my-2" />
              }
              
              // Handle special items
              if (item.id === 'tokens') {
                return (
                  <div key={item.id} className="flex items-center justify-between py-1.5 px-3">
              <div className="flex items-center space-x-2">
                <Coins size={16} className="text-white/60" />
                      <span className="text-xs font-medium text-white/60">{item.label}</span>
              </div>
              <span className="text-xs font-medium text-white">{tokenCount}</span>
            </div>
                )
              }


              
              // Handle toggle items
              if (item.type === 'toggle') {
                const settingValue = item.setting === 'autoShareToFeed' ? profileData.shareToFeed : false
                return (
                  <div key={item.id} className="flex items-center justify-between py-1.5 px-3">
                <div className="flex items-center space-x-2">
                      <Globe size={16} className="text-white/60" />
                      <span className="text-xs font-medium text-white/60">{item.label}</span>
                </div>
                <button
                  onClick={() => {
                        const newValue = !settingValue
                        if (item.setting === 'autoShareToFeed') {
                          updateProfile({ shareToFeed: newValue })
                          updateUserSettings(newValue)
                        }
                        // Only shareToFeed toggle is supported now
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                        settingValue ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform duration-200 ${
                          settingValue ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
                )
              }
              
              // Handle regular navigation items
              const IconComponent = item.icon
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                        setActiveTab(item.id)
                        setShowSettingsDropdown(false)
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-left transition-all duration-300 flex items-center justify-start space-x-3 ${
                      activeTab === item.id 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <IconComponent size={16} className="text-current" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                        </div>
              )
            })}
                        </div>
                    </div>



        {/* Legal and Social Media Links - Bottom Section */}
        <div className="mt-auto">
          <div className="space-y-1">
            {/* Logo - Above Legal */}
            <div className="py-2 px-3">
              <img
                src="/logo.png"
                alt="Stefna Logo"
                className="h-8 w-auto"
              />
            </div>

            <div className="py-2 px-3">
              <span className="text-xs font-medium text-white/60">Legal</span>
            </div>

            {/* Legal Pages - Horizontal */}
            <div className="flex items-center space-x-2 px-3">
              <button
                onClick={() => navigate('/privacy')}
                className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                title="Privacy Policy"
              >
                <Shield size={16} className="text-white" />
              </button>
              <button
                onClick={() => navigate('/terms')}
                className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                title="Terms of Service"
              >
                <FileText size={16} className="text-white" />
              </button>
              <button
                onClick={() => navigate('/cookies')}
                className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                title="Cookies Policy"
              >
                <Cookie size={16} className="text-white" />
              </button>
            </div>

            <div className="py-2 px-3">
              <span className="text-xs font-medium text-white/60">Social Media</span>
            </div>

            {/* Social Media Pages - Horizontal */}
            <div className="flex items-center space-x-2 px-3">
              <a href="https://www.instagram.com/stefnaxyz/" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90" title="Instagram">
                <InstagramIcon size={18} className="text-white" />
              </a>
              <a
                href="https://x.com/StefnaXYZ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="X"
              >
                <XIcon size={18} className="text-white" />
              </a>
              <a
                href="https://www.facebook.com/Stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="Facebook"
              >
                <FacebookIcon size={18} className="text-white" />
              </a>
              <a
                href="https://www.tiktok.com/@stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="TikTok"
              >
                <TikTokIcon size={18} className="text-white" />
              </a>
              <a
                href="https://www.threads.net/@stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="Threads"
              >
                <ThreadsIcon size={18} className="text-white" />
              </a>
              <a href="https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90" title="YouTube">
                <YouTubeIcon size={18} className="text-white" />
              </a>
            </div>
          </div>


        </div>
      </div>

      {/* Main Area - 80% */}
      <div className="w-[80%] bg-black h-screen overflow-y-auto flex flex-col relative">
        {/* Profile Controls - Top Right */}
        {/* Fixed Navigation Bar - Top Right */}
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={handleUploadClick}
            className="w-12 h-12 rounded-full border transition-all duration-300 flex items-center justify-center hover:scale-105 relative group bg-white/10 text-white border-white/20 hover:bg-white/20"
            aria-label="Upload"
            title="Upload"
          >
            <Plus size={24} className="transition-transform duration-200" />
            
            {/* Hover Tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Upload
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black/80"></div>
            </div>
          </button>

          {/* Logout Button */}
          <div className="relative">
            <button
              onClick={() => {
                authService.logout()
                navigate('/')
              }}
              className="w-12 h-12 bg-white/10 text-white rounded-full border border-white/20 transition-all duration-300 flex items-center justify-center hover:bg-white/20 hover:scale-105"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={24} className="transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Notification System disabled on profile screen (only show in Notification tab) */}
        {/* Content based on active tab */}
        {activeTab === 'all-media' && (
          <div className="flex-1 overflow-y-auto p-6 pt-24">
            {/* Selection Controls */}
            {!isLoading && userMedia.length > 0 && (
              <div className="mb-6 flex items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSelectionMode}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelectionMode 
                        ? 'bg-white text-black hover:bg-white/90' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isSelectionMode ? 'Exit Selection' : 'Select Media'}
                  </button>
                  
                  {isSelectionMode && (
                    <>
                      <button
                        onClick={selectAllMedia}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllMedia}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        Deselect All
                      </button>
                      <span className="text-white/60 text-sm">
                        {selectedMediaIds.size} of {userMedia.length} selected
                      </span>
                    </>
                  )}
                </div>
                
                {isSelectionMode && selectedMediaIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={deleteSelectedMedia}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDeletingSelected}
                    >
                      {isDeletingSelected ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </div>
                      ) : (
                        `Delete Selected (${selectedMediaIds.size})`
                      )}
                    </button>
                    <button
                      onClick={deleteAllMedia}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/80 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDeletingAll}
                    >
                      {isDeletingAll ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Deleting All...</span>
                        </div>
                      ) : (
                        'Delete All'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Image size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">Loading your media...</p>
              </div>
            ) : (() => {
              console.log('🔍 Rendering all-media tab:', { userMediaLength: userMedia.length, userMedia: userMedia, isLoading })
              // Don't show "no media" if we're still loading or if we have items
              return !isLoading && userMedia.length === 0
            })() ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <Image size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No media yet</p>
              </div>
            ) : (
              <MasonryMediaGrid
                media={userMedia.map(m => ({
                  ...m,
                  aspectRatio: m.width && m.height ? m.width / Math.max(1, m.height) : (m.aspectRatio || 4/3),
                  width: m.width || 800,
                  height: m.height || Math.round((m.width || 800) / ((m.aspectRatio || 4/3)))
                }))}
                columns={3}
                onMediaClick={handleMediaClick}
                onDownload={handleDownload}
                onShare={handleShare}
                onDelete={handleDeleteMedia}
                showActions={true}
                className="pb-20"
                // Selection props
                isSelectionMode={isSelectionMode}
                selectedMediaIds={selectedMediaIds}
                onToggleSelection={toggleMediaSelection}
                // Enhanced loading states for actions
                deletingMediaIds={deletingMediaIds}
              />
            )}
          </div>
        )}





        {activeTab === 'draft' && (
          <div className="flex-1 overflow-y-auto p-6 pt-24">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <FileText size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">Loading your drafts...</p>
              </div>
            ) : (() => {
              console.log('🔍 Rendering draft tab:', { draftMediaLength: draftMedia.length, draftMedia: draftMedia, isLoading })
              return !isLoading && draftMedia.length === 0
            })() ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <FileText size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No drafts yet</p>
              </div>
            ) : (
              <DraftMediaGrid
                media={draftMedia}
                columns={3}
                onMediaClick={handleMediaClick}
                onEdit={handleEditDraft}
                onDelete={handleDeleteDraft}
                onShare={handleShare}
                showActions={true}
                className="pb-20"
                deletingMediaIds={deletingMediaIds}
              />
            )}
          </div>
        )}

        {activeTab === 'invite-friends' && (
          <div className="flex-1 p-6 pt-24">
            <div className="max-w-4xl mx-auto">
              {/* Invite Friends Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Invite Friends</h2>
                <p className="text-white/60 text-sm">Share Stefna with friends and earn bonus credits together</p>
              </div>

              {/* Invite Friends Content */}
              <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-8">
                {isAuthenticated && referralStats ? (
                  <div className="space-y-6">
                    {/* Benefits Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-white font-semibold mb-2 text-lg">You Get</div>
                        <div className="text-white/60">+50 credits after friend's first media</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-white font-semibold mb-2 text-lg">Friend Gets</div>
                        <div className="text-white/60">+25 credits on signup</div>
                      </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSendInvite} className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">Friend's Email</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10"
                            placeholder="Enter friend's email address"
                            disabled={isSendingInvite}
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSendingInvite || !inviteEmail.trim()}
                            className="bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSendingInvite ? 'Sending...' : 'Send Invite'}
                          </button>
                        </div>
                      </div>
                      
                      {inviteError && (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                          <p className="text-red-400 text-sm">{inviteError}</p>
                        </div>
                      )}
                      
                      {inviteSuccess && (
                        <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
                          <p className="text-white text-sm">{inviteSuccess}</p>
                        </div>
                      )}
                    </form>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-white">{referralStats.invites}</div>
                        <div className="text-white/60 text-sm">Friends Invited</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-white">{referralStats.tokensEarned}</div>
                        <div className="text-white/60 text-sm">Credits Earned</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <Users size={48} className="text-white/40" />
                    </div>
                    <p className="text-white/60 text-lg mb-4">Sign up to unlock the invite system!</p>
                    <p className="text-white/40 text-sm mb-6">Invite friends and earn bonus credits together</p>
                    <button
                      onClick={() => navigate('/auth')}
                      className="bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-white/90 transition-all duration-300"
                    >
                      Sign Up Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="flex-1 p-6 pt-24">
            <div className="max-w-2xl mx-auto">
              {/* Account Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
                <p className="text-white/60 text-sm">Manage your account information and security</p>
              </div>

              <div className="space-y-6">
                
                {/* Account Information */}
                <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                    <User size={20} className="mr-2" />
                    Account Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Email Address</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="email"
                          value={authService.getCurrentUser()?.email || 'user@example.com'}
                          disabled
                          className="flex-1 bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-3 text-white/60 cursor-not-allowed"
                        />
                        <button 
                          onClick={() => {
                            // Redirect to auth page for email change
                            navigate('/auth')
                          }}
                          className="bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Shield size={20} className="mr-2" />
                    Danger Zone
                  </h3>
                  
                  <p className="text-white/60 text-sm mb-4">
                    These actions cannot be undone. Your account and all AI media will be permanently deleted.
                  </p>
                  
                  <button 
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-screen media viewer */}
        <FullScreenMediaViewer
          isOpen={viewerOpen}
          media={viewerMedia}
          startIndex={viewerStartIndex}
          onClose={() => setViewerOpen(false)}


          onShowAuth={() => navigate('/auth')}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.media?.id === 'bulk-delete' ? `Delete ${selectedMediaIds.size} selected media?` : 
               confirm.media?.id === 'delete-all' ? `Delete all ${userMedia.length} media?` :
               "Delete media?"}
        message={confirm.media?.id === 'bulk-delete' ? 
          `Are you sure you want to delete ${selectedMediaIds.size} media items? This action cannot be undone.` : 
          confirm.media?.id === 'delete-all' ?
          `Are you sure you want to delete ALL ${userMedia.length} media items? This action cannot be undone.` :
          "This action cannot be undone."
        }
        confirmText={confirm.media?.id === 'bulk-delete' ? `Delete ${selectedMediaIds.size} Items` : 
                    confirm.media?.id === 'delete-all' ? `Delete All ${userMedia.length} Items` :
                    "Delete"}
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false })}
        onConfirm={async () => {
                      if (confirm.media) {
              if (confirm.media.id === 'bulk-delete') {
                // Handle bulk delete
                console.log('🗑️ Bulk deleting media:', selectedMediaIds.size, 'items')
                await handleConfirmDeleteSelected()
              } else if (confirm.media.id === 'delete-all') {
                // Handle delete all
                console.log('🗑️ Deleting all media items')
                await handleConfirmDeleteAll()
            } else {
              // Handle single delete
              const mediaToDelete = confirm.media
              console.log('🗑️ Deleting single media:', mediaToDelete.id)
              
              try {
                // Set loading state for this media
                setIsDeleting(mediaToDelete.id)
                setDeletingMediaIds(prev => new Set([...prev, mediaToDelete.id]))
                
                // Delete from server first
                const jwt = authService.getToken()
                let serverDeleteSuccess = false
                
                if (jwt) {
                  try {
                    const r = await authenticatedFetch('/.netlify/functions/delete-media', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        mediaId: mediaToDelete.id, 
                        userId: currentUserId 
                      })
                    })
                    
                    if (r.ok) {
                      serverDeleteSuccess = true
                      console.log('Server delete successful')
                      
                      // Add to deleted state for visual feedback
                      setDeletedMediaIds(prev => new Set([...prev, mediaToDelete.id]))
                    } else {
                      const errorText = await r.text()
                      console.warn('Server delete failed:', r.status, r.statusText, errorText)
                    }
                  } catch (serverError) {
                    console.error('Server delete error:', serverError)
                  }
                }

                // Update local state immediately for better UX
                const isDraft = draftMedia.some(draft => draft.id === mediaToDelete.id)
                
                if (isDraft) {
                  // Remove from draft media
                  setDraftMedia(prev => prev.filter(item => item.id !== mediaToDelete.id))
                } else {
                  // Remove from user media immediately
                  setUserMedia(prev => prev.filter(item => item.id !== mediaToDelete.id))
                  
                  // Update local storage as backup
                  try {
                    await userMediaService.deleteMedia(currentUserId, mediaToDelete.id)
                  } catch (localError) {
                    console.warn('⚠️ Local storage delete failed:', localError)
                  }
                }
                
                // Background refresh to ensure database sync
                setTimeout(() => {
                  loadUserMedia()
                }, 500)
                
                console.log('✅ Local state updated, media removed from UI')
                
              } catch (error) {
                console.error('❌ Delete operation failed:', error)
              } finally {
                // Clear loading state
                setIsDeleting(null)
                setDeletingMediaIds(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(mediaToDelete.id)
                  return newSet
                })
              }
            }
          }
          
          // Always close the modal
          setConfirm({ open: false })
        }}
      />
      
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditProfileModal(false)} />
          <div className="relative bg-[#222222] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowEditProfileModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Photo Upload */}
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                    {previewPhoto ? (
                      <img src={previewPhoto} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-white/40" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-white/90 transition-colors">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">Name</label>
              <input
                type="text"
                value={editingProfileData.name}
                onChange={(e) => setEditingProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Enter your name"
              />
            </div>



            {/* Sharing Preferences - Compact Row Layout */}
            <div className="mb-6">
              <div className="flex items-center justify-between space-x-6">
                <div className="flex items-center justify-between flex-1">
                  <label className="text-sm font-medium text-white">Share to Feed</label>
                  <button
                    onClick={() => setEditingProfileData(prev => ({ ...prev, shareToFeed: !prev.shareToFeed }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editingProfileData.shareToFeed ? 'bg-white' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                        editingProfileData.shareToFeed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>


              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="w-full bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteAccountModal(false)} />
          <div className="relative bg-[#222222] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Delete Account</h1>
              <p className="text-white/60">This action cannot be undone</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete Account Permanently
              </button>
              
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="w-full bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}
export default ProfileScreen
