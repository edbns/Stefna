import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Heart, FileText, Bell, Settings, Shield, Cookie, ArrowLeft, LogOut, X, User, Globe, ChevronRight } from 'lucide-react'
import { InstagramIcon, XIcon, FacebookIcon, TikTokIcon, ThreadsIcon, YouTubeIcon } from '../components/SocialIcons'
import RemixIcon from '../components/RemixIcon'
import MasonryMediaGrid from '../components/MasonryMediaGrid'
import DraftMediaGrid from '../components/DraftMediaGrid'
import { navigateToEditor } from '../utils/editorNavigation'
import FullScreenMediaViewer from '../components/FullScreenMediaViewer'
import userMediaService, { UserMedia } from '../services/userMediaService'
import authService from '../services/authService'
import ConfirmModal from '../components/ConfirmModal'
import tokenService, { UserTier } from '../services/tokenService'
import { authenticatedFetch } from '../utils/apiClient'

import userService from '../services/userService'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'

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
  // const location = useLocation()
  const [activeTab, setActiveTab] = useState<string>('all-media')
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteConfirmed, setBulkDeleteConfirmed] = useState(false)
  const [profileData, setProfileData] = useState({
    name: 'User Name',
    bio: 'AI artist exploring the boundaries of creativity 🎨',
    avatar: null as File | string | null,
    shareToFeed: false,
    allowRemix: false
  })

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
      setShowInviteFriendsModal(true)
    }

    window.addEventListener('openInviteModal', handleOpenInviteModal)
    return () => {
      window.removeEventListener('openInviteModal', handleOpenInviteModal)
    }
  }, [])

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
        const userData = await response.json()
        console.log('✅ Profile loaded from database:', userData)
        
        const profileData = {
          name: userData.name || '',
          avatar: userData.avatar || ''  // Changed from 'photo' to 'avatar' for consistency
        }
        
        setProfileData(prev => ({ ...prev, ...profileData }))
        
        // Also update localStorage for consistency and offline access
        localStorage.setItem('userProfile', JSON.stringify(profileData))
      } else {
        console.warn('⚠️ Failed to load profile from database, falling back to localStorage')
        // Fallback to localStorage if database fails
        const savedProfile = localStorage.getItem('userProfile')
        if (savedProfile) {
          try {
            const parsedProfile = JSON.parse(savedProfile)
            setProfileData(prev => ({ ...prev, ...parsedProfile }))
          } catch (error) {
            console.error('Failed to load profile data from localStorage:', error)
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to load profile from database:', error)
      // Fallback to localStorage on error
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          setProfileData(prev => ({ ...prev, ...parsedProfile }))
        } catch (error) {
          console.error('Failed to load profile data from localStorage:', error)
        }
      }
    }
  }

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [userMedia, setUserMedia] = useState<UserMedia[]>([])
  const [remixedMedia, setRemixedMedia] = useState<UserMedia[]>([])
  const [likedMedia, setLikedMedia] = useState<UserMedia[]>([])
  const [draftMedia, setDraftMedia] = useState<UserMedia[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerMedia, setViewerMedia] = useState<UserMedia[]>([])
  const [viewerStartIndex, setViewerStartIndex] = useState(0)
  const [confirm, setConfirm] = useState<{ open: boolean; media?: UserMedia }>({ open: false })
  const [_userTier, setUserTier] = useState<UserTier>(UserTier.REGISTERED)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string>('')
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Load profile data when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadProfileFromDatabase()
      // Load persisted user settings (shareToFeed, allowRemix)
      ;(async () => {
        try {
          const token = authService.getToken()
          if (!token) return
          const r = await fetch('/.netlify/functions/user-settings', { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
          if (r.ok) {
            const s = await r.json()
            setProfileData(prev => ({ ...prev, shareToFeed: !!s.shareToFeed, allowRemix: !!s.allowRemix }))
            localStorage.setItem('userProfile', JSON.stringify({ ...profileData, shareToFeed: !!s.shareToFeed, allowRemix: !!s.allowRemix }))
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
          setProfileData(prev => ({ ...prev, ...parsedProfile }))
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
  const [isMigrating, setIsMigrating] = useState(false)

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

  // Caption generation state
  const [isCaptionOpen, setIsCaptionOpen] = useState(false)
  const [captionPlatform, setCaptionPlatform] = useState<'instagram' | 'x' | 'tiktok'>('instagram')
  const [captionStyle, setCaptionStyle] = useState<'casual' | 'professional' | 'trendy' | 'artistic'>('trendy')
  const [captionOutput, setCaptionOutput] = useState('')
  const [isCaptionLoading, setIsCaptionLoading] = useState(false)
  const [selectedMediaForCaption, setSelectedMediaForCaption] = useState<UserMedia | null>(null)

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

  const deleteSelectedMedia = async () => {
    if (selectedMediaIds.size === 0) return

    try {
      const token = authService.getToken()
      if (!token) {
        addNotification('Delete Failed', 'Authentication required', 'error')
        return
      }

      // Show confirmation modal
      setShowBulkDeleteModal(true)
      return // Exit early, the actual deletion will happen when user confirms
    } catch (error) {
      console.error('❌ Bulk delete error:', error)
      addNotification('Delete Failed', 'Network or server error', 'error')
    }
  }

  // Actual bulk delete execution (called when user confirms)
  const executeBulkDelete = async () => {
    if (selectedMediaIds.size === 0) return

    try {
      const token = authService.getToken()
      if (!token) {
        addNotification('Delete Failed', 'Authentication required', 'error')
        return
      }

      // Delete each selected media item
      const deletePromises = Array.from(selectedMediaIds).map(async (mediaId) => {
        try {
          const response = await fetch(`/.netlify/functions/delete-media`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mediaId })
          })
          
          if (!response.ok) {
            throw new Error(`Failed to delete media ${mediaId}`)
          }
          
          return { success: true, mediaId }
        } catch (error) {
          console.error(`Failed to delete media ${mediaId}:`, error)
          return { success: false, mediaId, error }
        }
      })

      const results = await Promise.allSettled(deletePromises)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.length - successful

      if (successful > 0) {
        addNotification(
          'Bulk Delete Complete', 
          `Successfully deleted ${successful} media items${failed > 0 ? `, ${failed} failed` : ''}`, 
          'success'
        )
        
        // Clear selection and refresh media
        setSelectedMediaIds(new Set())
        setIsSelectionMode(false)
        await loadUserMedia()
      } else {
        addNotification('Delete Failed', 'No media items were deleted', 'error')
      }

    } catch (error) {
      console.error('❌ Bulk delete error:', error)
      addNotification('Delete Failed', 'Network or server error', 'error')
    } finally {
      setShowBulkDeleteModal(false)
    }
  }

  // Migrate user media from dev to prod environment
  const migrateUserMedia = async () => {
    try {
      setIsMigrating(true)
      const token = authService.getToken()
      if (!token) {
        addNotification('Migration Failed', 'Authentication required', 'error')
        return
      }

      console.log('🔄 Starting media migration...')
      const response = await fetch('/.netlify/functions/migrate-user-media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Migration completed:', result)
        
        if (result.totalMigrated > 0) {
          addNotification(
            'Migration Complete!', 
            `Successfully migrated ${result.totalMigrated} media items to production environment. They should now appear on the home feed.`, 
            'success'
          )
          
          // Refresh user media to show updated data
          await loadUserMedia()
        } else {
          addNotification(
            'No Migration Needed', 
            'All your media is already in the correct environment.', 
            'info'
          )
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Migration failed:', errorData)
        addNotification('Migration Failed', errorData.error || 'Unknown error', 'error')
      }
    } catch (error) {
      console.error('❌ Migration error:', error)
      addNotification('Migration Failed', 'Network or server error', 'error')
    } finally {
      setIsMigrating(false)
    }
  }

  // Load user media from database using new Netlify Function
  const loadUserMedia = async () => {
    try {
      // Get current user ID from auth service
      const user = authService.getCurrentUser()
      const userId = user?.id || 'guest-user'
      setCurrentUserId(userId)
      
      // Set authentication status and user tier
      if (user) {
        setIsAuthenticated(true)
        // Map user tier from auth service
        const tierMap: { [key: string]: UserTier } = {
          'registered': UserTier.REGISTERED,
          'pro': UserTier.VERIFIED,
          'verified': UserTier.VERIFIED,
          'contributor': UserTier.CONTRIBUTOR
        }
        const currentTier = tierMap[user.tier] || UserTier.REGISTERED
        setUserTier(currentTier)
        
        // Load referral stats for authenticated users
        try {
          const stats = await tokenService.getReferralStats(userId)
          setReferralStats(stats)
          
          // Load token count - force refresh if tier changed
          // Prefer server-side quota for accuracy
          try {
            const qRes = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' })
            if (qRes.ok) {
              const q = await qRes.json()
              setTokenCount((q.daily_limit || 0) - (q.daily_used || 0))
            } else {
              // Fallback to client service
              const tokenUsage = await tokenService.getUserUsage(userId)
              setTokenCount(tokenUsage.dailyLimit - tokenUsage.dailyUsage)
            }
          } catch {
            const tokenUsage = await tokenService.getUserUsage(userId)
            setTokenCount(tokenUsage.dailyLimit - tokenUsage.dailyUsage)
          }
        } catch (error) {
          console.error('Failed to load referral stats or token count:', error)
          // Set default token count based on tier
          const defaultLimit = currentTier === UserTier.CONTRIBUTOR ? 120 : 
                             currentTier === UserTier.VERIFIED ? 60 : 30
          setTokenCount(defaultLimit)
        }
      } else {
        setIsAuthenticated(false)
        setUserTier(UserTier.REGISTERED) // Default to registered tier for unauthenticated users
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
          const response = await fetch('/.netlify/functions/getUserMedia', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwt}`,
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
            
            // Transform database media to UserMedia format
            const transformedMedia: UserMedia[] = dbMedia.map((item: any) => {
              console.log(`🔍 Database item ${item.id}:`, { 
                prompt: item.prompt, 
                mode: item.mode, 
                meta: item.meta 
              });
              
              return {
                id: item.id,
                userId: item.user_id,
                type: item.resource_type === 'video' ? 'video' : 'photo',
                url: toAbsoluteCloudinaryUrl(item.result_url) || toAbsoluteCloudinaryUrl(item.url) || item.result_url || item.url,
                prompt: item.prompt || 'AI Generated Content',
                aspectRatio: 4/3, // Default aspect ratio
                width: 800,
                height: 600,
                timestamp: item.created_at,
                tokensUsed: 2, // Default token usage
                likes: 0, // Will be updated when we implement likes
                remixCount: 0, // Will be updated when we implement remix counts
                isPublic: item.visibility === 'public',
                allowRemix: item.allow_remix || false,
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
                  } else {
          console.error('Failed to load user media from database:', response.statusText);
          // Fallback to local service if database fails
          const allMedia = await userMediaService.getAllUserMedia(userId);
          console.log('📊 Fallback: Setting userMedia with', allMedia.length, 'items from local service')
          setUserMedia(allMedia);
        }
        }
      } catch (error) {
        console.error('Failed to load user media from database:', error);
        // Fallback to local service if database fails
        const allMedia = await userMediaService.getAllUserMedia(userId);
        setUserMedia(allMedia);
      }

      // Load remixed media (for now, filter from user media)
      const remixes = userMedia.filter(m => m.type === 'remix')
      // Ensure remixes have user avatar for home page display
      const remixesWithAvatar = remixes.map(remix => ({
        ...remix,
        userAvatar: typeof profileData.avatar === 'string' ? profileData.avatar : undefined,
        userTier: _userTier
      }));
      console.log('🔄 Setting remixedMedia with', remixesWithAvatar.length, 'items')
      setRemixedMedia(remixesWithAvatar)
      
      // Ensure we have the latest userMedia for filtering
      console.log('🔄 Current userMedia for filtering:', userMedia.length, 'items')

      // Load liked media (for now, empty - will be implemented with database)
      setLikedMedia([])

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
      
      // Debug: Log final state
      console.log('🎯 Final media state:', {
        userMedia: userMedia.length,
        remixedMedia: remixesWithAvatar.length,
        totalItems: userMedia.length + remixesWithAvatar.length
      })

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
    const handleUserMediaUpdated = () => {
      console.log('🔄 ProfileScreen received userMediaUpdated event, refreshing...')
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
    
    window.addEventListener('userMediaUpdated', handleUserMediaUpdated)
    
    return () => {
      window.removeEventListener('userMediaUpdated', handleUserMediaUpdated)
    }
  }, [])
  
  // Monitor activeTab changes to ensure media is properly loaded
  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab)
    console.log('📊 Current media state:', {
      userMedia: userMedia.length,
      remixedMedia: remixedMedia.length,
      isLoading
    })
  }, [activeTab, userMedia.length, remixedMedia.length, isLoading])







  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const profileDataToSave = { ...profileData }
      let avatarUrl: string | undefined = undefined
      if (profileData.avatar instanceof File) {
        const up = await uploadToCloudinary(profileData.avatar, `users/${authService.getCurrentUser()?.id || 'me'}`)
        avatarUrl = up.secure_url
        profileDataToSave.avatar = avatarUrl
      } else if (typeof profileData.avatar === 'string') {
        avatarUrl = profileData.avatar
      }

      // Persist to server
      const token = authService.getToken()
      if (token) {
        await userService.updateProfile(token, {
          name: profileDataToSave.name,
          avatar: avatarUrl,
        })
      }

      // Save locally for UI
      localStorage.setItem('userProfile', JSON.stringify(profileDataToSave))
      addNotification('Profile Updated', 'Your profile has been saved successfully', 'success')
      setShowEditProfileModal(false)
    } catch (e) {
      console.error('Save profile failed:', e)
      addNotification('Update failed', 'Could not update profile', 'error')
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
    
    const active = activeTab === 'liked' ? likedMedia : activeTab === 'remixed' ? remixedMedia : activeTab === 'draft' ? draftMedia : userMedia
    const index = active.findIndex(m => m.id === media.id)
    setViewerMedia(active)
    setViewerStartIndex(Math.max(0, index))
    setViewerOpen(true)
  }

  const handleDownload = async (media: UserMedia) => {
    try {
      const resp = await fetch(media.url, { mode: 'cors' })
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ext = media.type === 'video' ? 'mp4' : 'jpg'
      link.download = `stefna-${media.id}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      addNotification('Download failed', 'Unable to download file', 'error')
    }
  }

  // Updated share function that updates database visibility
  const handleShare = async (media: UserMedia) => {
    try {
      // Auth guard: require JWT before attempting to change visibility
      if (!authService.getToken()) {
        addNotification('Login Required', 'Please sign in to change visibility', 'warning')
        navigate('/auth')
        return
      }

      // Update media visibility in database using recordShare
      const response = await fetch('/.netlify/functions/recordShare', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_id: media.id,
          shareToFeed: true,
          allowRemix: media.allowRemix
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Share successful:', result)
        
        // Update local state with server response
        setUserMedia(prev => prev.map(item => 
          item.id === media.id 
            ? { 
                ...item, 
                visibility: result.asset.visibility,
                allowRemix: result.asset.allow_remix,
                env: result.asset.env
              }
            : item
        ))
        
        addNotification('Media Shared', 'Your media is now public!', 'success')
      } else {
        const error = await response.json()
        addNotification('Share Failed', error.error || 'Failed to share media', 'error')
      }
    } catch (error) {
      console.error('Failed to share media:', error)
      addNotification('Share Failed', 'Failed to share media. Please try again.', 'error')
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
      const response = await fetch('/.netlify/functions/recordShare', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_id: media.id,
          shareToFeed: false,
          allowRemix: false
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
                allowRemix: result.asset.allow_remix,
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

  // Handle likes and remixes with real functionality
  const handleLike = async (media: UserMedia) => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      addNotification('Login Required', 'Please sign in to like media', 'warning')
      navigate('/auth')
      return
    }
    
    const user = authService.getCurrentUser()
    const currentUserId = user?.id || localStorage.getItem('stefna_guest_id') || 'guest-anon'
    const { liked, likes } = await userMediaService.toggleLike(media.id, currentUserId)
    setLikedMedia(prev => {
      const exists = prev.some(m => m.id === media.id)
      if (liked && !exists) return [media, ...prev]
      if (!liked && exists) return prev.filter(m => m.id !== media.id)
      return prev
    })
    setUserMedia(prev => prev.map(item => item.id === media.id ? { ...item, likes } : item))
  }

  const handleRemix = (media: UserMedia) => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      addNotification('Login Required', 'Please sign in to remix media', 'warning')
      navigate('/auth')
      return
    }
    
    // Close viewer if open, then navigate to home with remix payload
    setViewerOpen(false)
    navigate('/', { state: { remixUrl: media.url, remixPrompt: media.prompt || '', source: 'profile' } })
  }

  // Deletion handled in specific grid handlers
  const handleDeleteMedia = (media: UserMedia) => {
    setConfirm({ open: true, media })
  }

  const handleEditDraft = (media: UserMedia) => {
    navigateToEditor(navigate, media.url, media.prompt)
  }

  const handleDeleteDraft = (media: UserMedia) => {
    setConfirm({ open: true, media })
  }

  // Caption generation handlers
  const handleGenerateCaption = (media: UserMedia) => {
    setSelectedMediaForCaption(media)
    setIsCaptionOpen(true)
    setCaptionOutput('')
  }

  const handleGenerateCaptionContent = async () => {
    if (!selectedMediaForCaption) return
    
    setIsCaptionLoading(true)
    try {
      // For now, we'll generate a simple caption based on the media
      // In the future, this could call an AI service
      const caption = `Amazing AI-generated ${selectedMediaForCaption.type} created with Stefna! ✨ #AIArt #Stefna #${captionStyle}`
      setCaptionOutput(caption)
    } catch (error) {
      console.error('Error generating caption:', error)
      setCaptionOutput('Failed to generate caption')
    } finally {
      setIsCaptionLoading(false)
    }
  }

  const handleCopyCaption = async () => {
    if (!captionOutput) return
    try {
      await navigator.clipboard.writeText(captionOutput)
      addNotification('Copied', 'Caption copied to clipboard', 'success')
    } catch (e) {
      addNotification('Copy failed', 'Unable to copy caption', 'error')
    }
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
    { id: 'all-media', label: 'All Media', icon: Image },
    { id: 'liked', label: 'Liked', icon: Heart },
    { id: 'remixed', label: 'Remixed', icon: RemixIcon },
    { id: 'draft', label: 'Draft', icon: FileText },
    { id: 'notification', label: 'Notification', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  // Persist user settings helper
  const updateUserSettings = async (shareToFeed: boolean, allowRemix: boolean) => {
    const token = authService.getToken()
    if (!token) return
    try {
      const r = await fetch('/.netlify/functions/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shareToFeed, allowRemix })
      })
      if (r.ok) {
        const s = await r.json()
        setProfileData(prev => ({ ...prev, shareToFeed: !!s.shareToFeed, allowRemix: !!s.allowRemix }))
        localStorage.setItem('userProfile', JSON.stringify({ ...profileData, shareToFeed: !!s.shareToFeed, allowRemix: !!s.allowRemix }))
      }
    } catch (e) {
      // keep local state; will retry next time
    }
  }

  return (
    <div className="min-h-screen bg-black flex">
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

        {/* Logout Icon - Top Right */}
        <button 
          onClick={() => {
            authService.logout()
            navigate('/')
          }}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-300"
          title="Logout"
        >
          <LogOut size={20} />
        </button>

        {/* All Navigation Items in One Block */}
        <div className="flex-1">
          <div className="space-y-1">
            {/* Toggle Switches */}
            <div className="space-y-1">
              {/* Share to Feed Toggle */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-left transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Globe size={16} className="text-white/60" />
                  <span className="text-xs font-medium text-white/60">Share to Feed</span>
                </div>
                <button
                  onClick={() => {
                    const nextShare = !profileData.shareToFeed
                    const nextAllow = nextShare ? profileData.allowRemix : false
                    setProfileData(prev => ({ ...prev, shareToFeed: nextShare, allowRemix: nextAllow }))
                    localStorage.setItem('userProfile', JSON.stringify({ ...profileData, shareToFeed: nextShare, allowRemix: nextAllow }))
                    // Persist to server
                    updateUserSettings(nextShare, nextAllow)
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

              {/* Allow Remix Toggle */}
              <div className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-left transition-all duration-300 ${
                !profileData.shareToFeed ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center space-x-2">
                  <RemixIcon size={16} className={`${!profileData.shareToFeed ? 'text-white/30' : 'text-white/60'}`} />
                  <span className={`text-xs font-medium ${!profileData.shareToFeed ? 'text-white/30' : 'text-white/60'}`}>
                    Allow Remix
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Only allow toggling if share to feed is enabled
                    if (profileData.shareToFeed) {
                      const nextAllow = !profileData.allowRemix
                      setProfileData(prev => ({ ...prev, allowRemix: nextAllow }))
                      localStorage.setItem('userProfile', JSON.stringify({ ...profileData, allowRemix: nextAllow }))
                      updateUserSettings(true, nextAllow)
                    }
                  }}
                  disabled={!profileData.shareToFeed}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    profileData.allowRemix && profileData.shareToFeed ? 'bg-white' : 'bg-white/20'
                  } ${!profileData.shareToFeed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform duration-200 ${
                      profileData.allowRemix && profileData.shareToFeed ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>




            </div>





            {/* Navigation Tabs */}
            {sidebarItems.map((item) => {
              const IconComponent = item.icon
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.id === 'settings') {
                        setShowSettingsDropdown(!showSettingsDropdown)
                      } else {
                        setActiveTab(item.id)
                        setShowSettingsDropdown(false)
                      }
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
                  
                  {/* Settings Dropdown */}
                  {item.id === 'settings' && showSettingsDropdown && (
                    <div className="mt-1 space-y-1">
                      <button 
                        onClick={() => setShowEditProfileModal(true)}
                        className="w-full py-1.5 px-3 rounded-lg text-left btn-optimized flex items-center justify-start space-x-3 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20"
                      >
                        <div className="flex items-center space-x-3">
                          <User size={16} className="text-current" />
                          <span className="text-xs font-medium">Edit Profile</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="w-full py-1.5 px-3 rounded-lg text-left btn-optimized flex items-center justify-start space-x-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 active:bg-red-500/30"
                      >
                        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-current">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium">Delete Account</span>
                      </button>
                    </div>
                  )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBulkDeleteModal(false)} />
          <div className="relative bg-[#222222] border border-white/20 rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-white text-xl font-bold mb-3">Delete Selected Media</h2>
              <p className="text-white/60 text-sm">
                Are you sure you want to delete {selectedMediaIds.size} media item{selectedMediaIds.size !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={executeBulkDelete}
                className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 btn-optimized"
              >
                Delete {selectedMediaIds.size} Item{selectedMediaIds.size !== 1 ? 's' : ''}
              </button>
              
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="w-full bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 btn-optimized border border-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
        {/* Notification System disabled on profile screen (only show in Notification tab) */}
        {/* Content based on active tab */}
        {activeTab === 'all-media' && (
          <div className="flex-1 overflow-y-auto p-6">
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
                  <button
                    onClick={deleteSelectedMedia}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                  >
                    Delete Selected ({selectedMediaIds.size})
                  </button>
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
                <p className="text-white/40 text-sm text-center mt-2">Your created media will appear here</p>
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
                onUnshare={handleUnshare}
                onRemix={handleRemix}
                onDelete={handleDeleteMedia}
                onGenerateCaption={handleGenerateCaption}
                showActions={true}
                className="pb-20"
                hideRemixCount={true}
                hideUserAvatars={true}
                // Selection props
                isSelectionMode={isSelectionMode}
                selectedMediaIds={selectedMediaIds}
                onToggleSelection={toggleMediaSelection}
              />
            )}
          </div>
        )}

        {activeTab === 'liked' && (
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Heart size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">Loading your liked media...</p>
              </div>
            ) : (() => {
              console.log('🔍 Rendering liked tab:', { likedMediaLength: likedMedia.length, likedMedia: likedMedia, isLoading })
              return !isLoading && likedMedia.length === 0
            })() ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <Heart size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No liked media yet</p>
                <p className="text-white/40 text-sm text-center mt-2">Like media to see it here</p>
              </div>
            ) : (
              <MasonryMediaGrid
                media={likedMedia.map(m => ({
                  ...m,
                  aspectRatio: m.width && m.height ? m.width / Math.max(1, m.height) : (m.aspectRatio || 4/3),
                  width: m.width || 800,
                  height: m.height || Math.round((m.width || 800) / ((m.aspectRatio || 4/3)))
                }))}
                columns={3}
                onMediaClick={handleMediaClick}
                onDownload={handleDownload}
                onShare={handleShare}
                onUnshare={handleUnshare}
                onRemix={handleRemix}
                onDelete={handleDeleteMedia}
                onGenerateCaption={handleGenerateCaption}
                showActions={true}
                className="pb-20"
                hideRemixCount={true}
                hideUserAvatars={true}
              />
            )}
          </div>
        )}

        {activeTab === 'remixed' && (
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <RemixIcon size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">Loading your remixes...</p>
              </div>
            ) : (() => {
              console.log('🔍 Rendering remixed tab:', { remixedMediaLength: remixedMedia.length, remixedMedia: remixedMedia, isLoading })
              return !isLoading && remixedMedia.length === 0
            })() ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <RemixIcon size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No remixes yet</p>
                <p className="text-white/40 text-sm text-center mt-2">Your remixed media will appear here</p>
              </div>
            ) : (
              <MasonryMediaGrid
                media={remixedMedia.map(m => ({
                  ...m,
                  aspectRatio: m.width && m.height ? m.width / Math.max(1, m.height) : (m.aspectRatio || 4/3),
                  width: m.width || 800,
                  height: m.height || Math.round((m.width || 800) / ((m.aspectRatio || 4/3)))
                }))}
                columns={3}
                onMediaClick={handleMediaClick}
                onDownload={handleDownload}
                onShare={handleShare}
                onUnshare={handleUnshare}
                onRemix={handleRemix}
                onDelete={handleDeleteMedia}
                onGenerateCaption={handleGenerateCaption}
                showActions={true}
                className="pb-20"
                hideRemixCount={true}
                hideUserAvatars={true}
              />
            )}
          </div>
        )}

        {activeTab === 'draft' && (
          <div className="flex-1 overflow-y-auto p-6">
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
                <p className="text-white/40 text-sm text-center mt-2">Your draft media will appear here</p>
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
              />
            )}
          </div>
        )}

        {activeTab === 'notification' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Bell size={48} className="text-white/40" />
              </div>
              <p className="text-white/60 text-lg text-center">Notifications disabled</p>
              <p className="text-white/40 text-sm text-center mt-2">Notifications only appear on the home page</p>
            </div>
          </div>
        )}

        {/* Full-screen media viewer */}
        <FullScreenMediaViewer
          isOpen={viewerOpen}
          media={viewerMedia}
          startIndex={viewerStartIndex}
          onClose={() => setViewerOpen(false)}
          onLike={(m) => handleLike(m)}
          onRemix={(m) => handleRemix(m)}
          onShowAuth={() => navigate('/auth')}
        />
      </div>

      {/* Profile Edit Modal */}
      <ConfirmModal
        isOpen={confirm.open}
        title="Delete media?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false })}
        onConfirm={async () => {
          if (confirm.media) {
            const mediaToDelete = confirm.media
            console.log('🗑️ Deleting media:', mediaToDelete.id)
            
            try {
              // Delete from server first
              const jwt = authService.getToken()
              let serverDeleteSuccess = false
              
              if (jwt) {
                try {
                  const r = await fetch('/.netlify/functions/delete-media', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: mediaToDelete.id })
                  })
                  
                  if (r.ok) {
                    serverDeleteSuccess = true
                    console.log('✅ Server delete successful')
                  } else {
                    console.warn('⚠️ Server delete failed:', r.status, r.statusText)
                  }
                } catch (serverError) {
                  console.error('❌ Server delete error:', serverError)
                }
              }

              // Update local state immediately for better UX
              const isDraft = draftMedia.some(draft => draft.id === mediaToDelete.id)
              
              if (isDraft) {
                // Remove from draft media
                setDraftMedia(prev => prev.filter(item => item.id !== mediaToDelete.id))
                // Draft Deleted - no notification needed
              } else {
                // Remove from user media immediately
                setUserMedia(prev => prev.filter(item => item.id !== mediaToDelete.id))
                
                // Also remove from remixed media if it exists there
                setRemixedMedia(prev => prev.filter(item => item.id !== mediaToDelete.id))
                
                // Update local storage as backup
                try {
                  await userMediaService.deleteMedia(currentUserId, mediaToDelete.id)
                } catch (localError) {
                  console.warn('⚠️ Local storage delete failed:', localError)
                }
                
                // Media Deleted - no notification needed
              }
              
              console.log('✅ Local state updated, media removed from UI')
              
            } catch (error) {
              console.error('❌ Delete operation failed:', error)
              // Delete Failed - no notification needed
            }
          }
          
          // Always close the modal
          setConfirm({ open: false })
        }}
      />
      
      {showEditProfileModal && (
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Enter your name"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSaveProfile}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors"
              >
                Save Changes
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

      {/* Invite Friends Modal */}
      {showInviteFriendsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInviteFriendsModal(false)} />
          <div className="relative bg-[#222222] border border-white/20 rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowInviteFriendsModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-white text-xl font-bold mb-3">Invite Friends</h2>
              <p className="text-white/60 text-sm">Share Stefna with your friends via email</p>
            </div>

            {isAuthenticated && referralStats ? (
              <div className="space-y-6">
                {/* What you get */}
                 <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2 text-sm">You get</h3>
                  <p className="text-white/60 text-sm">+10 bonus tokens after your friend's first generation</p>
                </div>

                {/* What your friends get */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2 text-sm">Your friends get</h3>
                  <p className="text-white/60 text-sm">+10 bonus tokens on signup with your invite</p>
                </div>

                {/* Email Invite Form */}
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <label className="text-white/60 text-sm mb-3 block">Friend's Email</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none border-b border-white/20 focus:border-white/40 pb-2"
                        placeholder="Enter friend's email address"
                        disabled={isSendingInvite}
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSendingInvite || !inviteEmail.trim()}
                        className="bg-white text-black font-semibold py-2 px-5 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingInvite ? 'Sending...' : 'Send'}
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
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-white">{referralStats.invites}</div>
                    <div className="text-white/60 text-xs mt-1">Friends Invited</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-xl font-bold text-white">{referralStats.tokensEarned}</div>
                    <div className="text-white/60 text-xs mt-1">Tokens Earned</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-white/60 mb-4">Sign up to unlock the invite system!</p>
                <button
                  onClick={() => {
                    setShowInviteFriendsModal(false)
                    navigate('/auth')
                  }}
                  className="bg-white text-black font-semibold py-2 px-6 rounded-xl hover:bg-white/90 transition-all duration-300"
                >
                  Sign Up Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      

      {/* Caption Modal */}
      {isCaptionOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#222222] border border-white/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-medium text-lg">Generate Caption</div>
              <button onClick={() => setIsCaptionOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-white/70 text-sm mb-2">Platform</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['instagram','x','tiktok'] as const).map(p => (
                    <button key={p} onClick={() => setCaptionPlatform(p)} className={`px-3 py-2 rounded-lg text-sm border transition-colors ${captionPlatform===p? 'border-white/40 text-white bg-white/10':'border-white/20 text-white/80 hover:text-white hover:bg-white/5'}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-white/70 text-sm mb-2">Style</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['trendy','casual','professional','artistic'] as const).map(s => (
                    <button key={s} onClick={() => setCaptionStyle(s)} className={`px-2 py-2 rounded-lg text-xs border transition-colors ${captionStyle===s? 'border-white/40 text-white bg-white/10':'border-white/20 text-white/80 hover:text-white hover:bg-white/5'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={handleGenerateCaptionContent} className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50 transition-colors" disabled={isCaptionLoading}>
                  {isCaptionLoading? 'Generating…' : 'Generate'}
                </button>
                <button onClick={handleCopyCaption} className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm disabled:opacity-50 hover:bg-white/5 transition-colors" disabled={!captionOutput}>
                  Copy
                </button>
              </div>
              <div>
                <textarea value={captionOutput} onChange={(e)=>setCaptionOutput(e.target.value)} placeholder="Your caption will appear here" className="w-full h-28 p-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 resize-none text-sm focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors" />
                <div className="text-white/50 text-xs mt-2">Includes #AiAsABrush automatically</div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
export default ProfileScreen
