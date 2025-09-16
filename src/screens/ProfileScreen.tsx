import React, { useState, useEffect, useRef } from 'react'
// CACHE BUSTER: 2025-01-20 - Force frontend cache invalidation
import { useNavigate } from 'react-router-dom'
import { Image, Heart, FileText, Bell, Settings, Shield, Cookie, ArrowLeft, LogOut, X, User, Globe, ChevronRight, Coins, Users, Plus, Instagram as InstagramIcon, Facebook as FacebookIcon, Youtube as YouTubeIcon } from 'lucide-react'
// RemixIcon import removed - no more remix functionality

// Custom TikTok icon since lucide-react doesn't have one
const TikTokIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.36 6.36 0 00-1-.05A6.35 6.35 0 005 15.77a6.34 6.34 0 0011.14 4.16v-6.61a8.16 8.16 0 004.65 1.46v-3.44a4.85 4.85 0 01-1.2-.65z"/>
  </svg>
)

// Custom Threads icon since lucide-react doesn't have one
const ThreadsIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/>
  </svg>
)

// Custom X (formerly Twitter) icon since lucide-react still has the old Twitter logo
const XIconCustom = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
import MasonryMediaGrid from '../components/MasonryMediaGrid'
import DraftMediaGrid from '../components/DraftMediaGrid'
import LoadingSpinner from '../components/LoadingSpinner'
import LQIPImage from '../components/LQIPImage'
import { navigateToEditor } from '../utils/editorNavigation'
import FullScreenMediaViewer from '../components/FullScreenMediaViewer'
import userMediaService, { UserMedia } from '../services/userMediaService'
import authService from '../services/authService'
import ConfirmModal from '../components/ConfirmModal'
// import tokenService from '../services/tokenService' // Removed in cleanup
import { authenticatedFetch } from '../utils/apiClient'
import { useToasts } from '../components/ui/Toasts'
import ProfileIcon from '../components/ProfileIcon'

import userService from '../services/userService'
import { uploadToCloudinary } from '../lib/cloudinaryUpload'

import { useProfile } from '../contexts/ProfileContext'
import { downloadAllMediaAsZip, downloadSelectedMediaAsZip, generateMediaFilename, DownloadableMedia } from '../utils/downloadUtils'


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
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [currentEmail, setCurrentEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)



  // Use profile context
  const { profileData, updateProfile, refreshProfile } = useProfile()

  // Load current email from database
  const loadCurrentEmail = async () => {
    try {
      const response = await authenticatedFetch('/.netlify/functions/get-user-profile', {
        method: 'GET'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setCurrentEmail(userData.user?.email || userData.email || '')
      }
    } catch (error) {
      console.error('Failed to load current email:', error)
      // Fallback to auth service email
      setCurrentEmail(authService.getCurrentUser()?.email || '')
    }
  }

  // Load email on component mount
  useEffect(() => {
    loadCurrentEmail()
  }, [])

  // Send OTP for email change
  const handleSendOtp = async () => {
    if (!newEmail.trim()) {
      notifyError({ title: 'Error', message: 'Enter a new email address' })
      return
    }

    setIsSendingOtp(true)
    try {
      const response = await authenticatedFetch('/.netlify/functions/request-email-change-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() })
      })

      if (response.ok) {
        notifyReady({ title: 'Success', message: 'Verification code sent to your new email address!' })
        setOtpSent(true)
      } else {
        const error = await response.json()
        notifyError({ title: 'Error', message: error.error || 'Failed to send verification code' })
      }
    } catch (error) {
      console.error('OTP send error:', error)
      notifyError({ title: 'Error', message: 'Failed to send verification code. Try again.' })
    } finally {
      setIsSendingOtp(false)
    }
  }
  


  // Handle navigation state for activeTab
  useEffect(() => {
    const state = (navigate as any).location?.state
    if (state?.activeTab) {
      setActiveTab(state.activeTab)
    }
  }, [navigate])

  // Handle email change
  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      notifyError({ title: 'Error', message: 'Enter a new email address' })
      return
    }

    if (!otpCode.trim()) {
      notifyError({ title: 'Error', message: 'Enter the verification code' })
      return
    }

    setIsChangingEmail(true)
    try {
      const response = await authenticatedFetch('/.netlify/functions/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newEmail: newEmail.trim(),
          otp: otpCode.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        notifyReady({ title: 'Success', message: 'Email updated successfully!' })
        setShowChangeEmailModal(false)
        setNewEmail('')
        setOtpCode('')
        setOtpSent(false)
        // Update current email state with the new email
        setCurrentEmail(data.newEmail)
        // Refresh profile data to get updated email
        refreshProfile()
      } else {
        const error = await response.json()
        notifyError({ title: 'Error', message: error.error || 'Failed to update email' })
      }
    } catch (error) {
      console.error('Email change error:', error)
      notifyError({ title: 'Error', message: 'Failed to update email. Try again.' })
    } finally {
      setIsChangingEmail(false)
    }
  }
  useEffect(() => {
    const handleOpenInviteModal = () => {
  
    }

    window.addEventListener('openInviteModal', handleOpenInviteModal)
    return () => {
      window.removeEventListener('openInviteModal', handleOpenInviteModal)
    }
  }, [])




  // Load profile data from database
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
        
        // Store the real user ID from the database response
        if (result.user?.id) {
          setCurrentUserId(result.user.id);
          console.log('✅ Set current user ID from profile:', result.user.id);
        }
        
        // Don't update any profile data here - we only care about user ID
        // ShareToFeed is loaded separately in the useEffect
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
            }
          }
        } catch (jwtError) {
          console.error('❌ Failed to parse JWT token:', jwtError);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load profile from database:', error)
    }
  }

  const [userMedia, setUserMedia] = useState<UserMedia[]>([])
  const [draftMedia, setDraftMedia] = useState<UserMedia[]>([])
  
  // 🚀 INFINITE SCROLL: Pagination state for user media
  const [mediaPage, setMediaPage] = useState(0)
  const [hasMoreMedia, setHasMoreMedia] = useState(true)
  const [isLoadingMoreMedia, setIsLoadingMoreMedia] = useState(false)
  const [mediaPageSize] = useState(20) // Load 20 items per page
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

  // Check authentication status on component mount
  useEffect(() => {
    const user = authService.getCurrentUser()
    if (user) {
      setIsAuthenticated(true)
      setCurrentUserId(user.id)
      console.log('✅ User authenticated on mount:', user.id)
    } else {
      setIsAuthenticated(false)
      console.log('❌ User not authenticated on mount')
    }
  }, [])

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
          setTimeout(() => {
            const user = authService.getCurrentUser()
            if (user) {
              loadUserMedia();
            }
          }, 100);
        }
      });
      
      // Load persisted user settings (shareToFeed)
      (async () => {
        try {
          const token = authService.getToken()
          if (!token) return
          const r = await authenticatedFetch('/.netlify/functions/user-settings', { method: 'GET' })
          if (r.ok) {
            const s = await r.json()
            console.log('📊 [ShareToFeed] Loaded from database:', s.settings?.share_to_feed);
            // Only update shareToFeed, don't touch other profile fields
            updateProfile({ shareToFeed: !!s.settings?.share_to_feed })
          } else {
            console.log('⚠️ [ShareToFeed] Failed to load settings, defaulting to false');
            updateProfile({ shareToFeed: false })
          }
        } catch (e) {
          console.error('❌ [ShareToFeed] Error loading settings:', e);
          // Default to false for privacy
          updateProfile({ shareToFeed: false })
        }
      })()
    }
  }, [isAuthenticated])

  // Add event listener for clear-composer-state to fix JavaScript error
  useEffect(() => {
    const handleClearComposerState = () => {
      // This is just to prevent the error - ProfileScreen doesn't have a composer
      console.log('🎭 [ProfileScreen] Received clear-composer-state event')
    }

    window.addEventListener('clear-composer-state', handleClearComposerState)
    
    return () => {
      window.removeEventListener('clear-composer-state', handleClearComposerState)
    }
  }, [])

  // Add global fallback to prevent handleClearComposerState errors
  useEffect(() => {
    // Create a global fallback function to prevent errors
    if (typeof window !== 'undefined') {
      (window as any).handleClearComposerState = () => {
        console.log('🎭 [ProfileScreen] Global handleClearComposerState called')
      }
    }
    
    return () => {
      // Clean up global function when component unmounts
      if (typeof window !== 'undefined') {
        delete (window as any).handleClearComposerState
      }
    }
  }, [])
  const [referralStats, setReferralStats] = useState<{ invites: number; tokensEarned: number; referralCode: string }>({ invites: 0, tokensEarned: 0, referralCode: '' })
  // const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState(0)



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

  // Download state
  const [isDownloadingSelected, setIsDownloadingSelected] = useState(false)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)



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
        const response = await authenticatedFetch('/.netlify/functions/delete-media', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json'
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
        
        // Background refresh removed to prevent duplicate loading
      } else {
        addNotification('Delete Failed', 'No media items were deleted', 'error')
      }
    } catch (error) {
      console.error('❌ Delete all error:', error)
      addNotification('Delete Failed', error instanceof Error ? error.message : 'Network or server error', 'error')
    } finally {
      setIsDeletingAll(false)
      setDeletingMediaIds(new Set())
      setConfirm({ open: false, media: undefined })
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
        const response = await authenticatedFetch('/.netlify/functions/delete-media', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json'
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
      
      // Background refresh removed to prevent duplicate loading
      
    } catch (error) {
      console.error('❌ Bulk delete error:', error)
      addNotification('Delete Failed', error instanceof Error ? error.message : 'Network or server error', 'error')
    } finally {
      setIsDeletingSelected(false)
      setDeletingMediaIds(new Set())
      setConfirm({ open: false, media: undefined })
    }
  }

  // Download functions
  const downloadAllMedia = async () => {
    if (userMedia.length === 0) {
      addNotification('No Media', 'No media files to download', 'warning')
      return
    }

    setIsDownloadingAll(true)
    
    try {
      // Convert user media to downloadable format
      const downloadableMedia: DownloadableMedia[] = userMedia.map((media, index) => ({
        id: media.id,
        url: toAbsoluteCloudinaryUrl(media.url) || media.url,
        filename: generateMediaFilename({
          id: media.id,
          url: media.url,
          filename: '',
          type: media.type === 'video' ? 'video' : 'image'
        }, index),
        type: media.type === 'video' ? 'video' : 'image'
      }))

      await downloadAllMediaAsZip(downloadableMedia, `all-media-${new Date().toISOString().split('T')[0]}.zip`)
      
      addNotification('Download Complete', `Downloaded ${userMedia.length} media files`, 'success')
    } catch (error) {
      console.error('❌ Download all error:', error)
      addNotification('Download Failed', error instanceof Error ? error.message : 'Failed to download media', 'error')
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const downloadSelectedMedia = async () => {
    if (selectedMediaIds.size === 0) {
      addNotification('No Selection', 'Please select media files to download', 'warning')
      return
    }

    setIsDownloadingSelected(true)
    
    try {
      // Get selected media items
      const selectedMedia = userMedia.filter(media => selectedMediaIds.has(media.id))
      
      // Convert to downloadable format
      const downloadableMedia: DownloadableMedia[] = selectedMedia.map((media, index) => ({
        id: media.id,
        url: toAbsoluteCloudinaryUrl(media.url) || media.url,
        filename: generateMediaFilename({
          id: media.id,
          url: media.url,
          filename: '',
          type: media.type === 'video' ? 'video' : 'image'
        }, index),
        type: media.type === 'video' ? 'video' : 'image'
      }))

      await downloadSelectedMediaAsZip(downloadableMedia, `selected-media-${new Date().toISOString().split('T')[0]}.zip`)
      
      addNotification('Download Complete', `Downloaded ${selectedMediaIds.size} selected media files`, 'success')
    } catch (error) {
      console.error('❌ Download selected error:', error)
      addNotification('Download Failed', error instanceof Error ? error.message : 'Failed to download selected media', 'error')
    } finally {
      setIsDownloadingSelected(false)
    }
  }

  // 🚀 INFINITE SCROLL: Load user media with pagination support
  const loadUserMedia = async (isInitialLoad: boolean = true, pageNumber?: number) => {
    // Prevent duplicate loading only for non-initial loads
    if (isLoading && !isInitialLoad) {
      console.log('⚠️ [ProfileScreen] Already loading media, skipping duplicate call');
      return;
    }
    
    // Use provided page number or current mediaPage
    const currentPage = pageNumber !== undefined ? pageNumber : mediaPage;
    
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
      
      // Authentication status already set in initial useEffect
      if (user) {
        // Map user tier from auth service
            // Removed tier system - all users get same experience
        
        // Load referral stats for authenticated users
        try {
          // Load referral stats from real database
          try {
            const referralRes = await authenticatedFetch('/.netlify/functions/get-referral-stats', { method: 'GET' })
            if (referralRes.ok) {
              const response = await referralRes.json()
              if (response.success && response.stats) {
                setReferralStats({
                  invites: response.stats.totalReferrals || 0,
                  tokensEarned: response.stats.totalCreditsEarned || 0,
                  referralCode: response.stats.referralCode || ''
                })
                console.log('✅ [ProfileScreen] Referral stats loaded:', response.stats)
              } else {
                console.log('⚠️ [ProfileScreen] No referral stats in response, keeping current values')
                // Don't reset to 0 - keep current values to prevent flickering
              }
            } else {
              console.log('⚠️ [ProfileScreen] Failed to load referral stats, keeping current values')
              // Don't reset to 0 - keep current values to prevent flickering
            }
          } catch (error) {
            console.error('❌ [ProfileScreen] Failed to load referral stats:', error)
            // Don't reset to 0 - keep current values to prevent flickering
          }
          
          // Load token count - simplified for new credits system
          // Prefer server-side quota for accuracy
          try {
            const qRes = await authenticatedFetch('/.netlify/functions/getQuota', { method: 'GET' })
            if (qRes.ok) {
              const q = await qRes.json()
              // Use currentBalance directly - this is the actual remaining credits
              setTokenCount(q.currentBalance || 0)
            } else {
              // Fallback to client service
              // Token service removed - use credits from user
              setTokenCount(14) // Default daily credits
            }
          } catch {
            // Token service removed - use default values
            setTokenCount(14) // Default daily credits
          }
        } catch (error) {
          console.error('Failed to load referral stats or token count:', error)
          // Simplified: all users get same daily limit (14)
          setTokenCount(14)
        }
      } else {
        // Authentication status already set in initial useEffect
        // Removed tier system - all users get same experience
      }

      // 🚀 INFINITE SCROLL: Load user media with pagination
      try {
        const jwt = authService.getToken() || localStorage.getItem('auth_token');
        
        if (!jwt) {
          // Guest user: skip server fetch, show local results only
          console.log('Guest user: skipping getUserMedia server call');
          const allMedia = await userMediaService.getAllUserMedia(userId);
          setUserMedia(allMedia);
        } else {
          // Authenticated user: fetch from server with JWT and pagination
          const offset = isInitialLoad ? 0 : currentPage * mediaPageSize;
          const limit = mediaPageSize;
          
          console.log('🚀 [ProfileScroll] Loading media page:', {
            page: currentPage,
            offset,
            limit,
            isInitialLoad
          });
          
          const response = await authenticatedFetch(`/.netlify/functions/getUserMedia?userId=${userId}&limit=${limit}&offset=${offset}`, {
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
                type: item.mediaType || item.type || 'photo', // Use actual mediaType from database
                url: toAbsoluteCloudinaryUrl(item.finalUrl) || item.finalUrl,
                prompt: item.prompt || (item.presetKey ? `Generated with ${item.presetKey}` : 'AI Generated Content'),
                aspectRatio: 4/3, // Default aspect ratio
                width: 800,
                height: 600,
                timestamp: item.createdAt,
                tokensUsed: 2, // Default token usage
                likes: 0, // Will be updated when we implement likes
                remixCount: 0, // Will be updated when we implement remix counts
                isPublic: item.isPublic || false,
                tags: [],
                // Add preset information for proper display
                presetKey: item.presetKey,
                metadata: {
                  quality: 'high',
                  generationTime: 0,
                  modelVersion: '1.0',
                  presetKey: item.presetKey,
                  presetType: item.type // Use the actual preset type (e.g., 'neo_glitch', 'presets', 'edit')
                },
                // Store additional fields needed for functionality
                cloudinaryPublicId: item.cloudinaryPublicId,
                mediaType: item.mediaType,
                // Store the original preset type for filtering - use the backend type directly
                presetType: item.type // Backend sends the actual preset type here (e.g., 'neo_glitch', 'presets', 'edit')
              };
            });
            
            // 🚀 INFINITE SCROLL: Handle pagination logic
            if (isInitialLoad) {
              // Initial load: replace all media
              console.log('📊 Setting userMedia with', transformedMedia.length, 'items (initial load)');
              setUserMedia(transformedMedia);
              setMediaPage(0);
            } else {
              // Load more: append to existing media (page already incremented in loadMoreMedia)
              console.log('📊 Appending', transformedMedia.length, 'more items to existing media');
              setUserMedia(prev => [...prev, ...transformedMedia]);
            }
            
            // Update hasMore flag based on response - ensure it's properly set
            const hasMore = result.hasMore !== false && transformedMedia.length === mediaPageSize;
            console.log('📊 [InfiniteScroll] hasMore updated:', { hasMore, receivedItems: transformedMedia.length, pageSize: mediaPageSize });
            setHasMoreMedia(hasMore);
            
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
        if (isInitialLoad) {
          setIsLoading(false);
        } else {
          setIsLoadingMoreMedia(false);
        }
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
    } catch (error) {
      console.error('Error in loadUserMedia:', error);
    }
  };

  // 🚀 INFINITE SCROLL: Load more media function
  const loadMoreMedia = async () => {
    if (!hasMoreMedia || isLoadingMoreMedia) return;
    
    console.log('🚀 [ProfileScroll] Loading more media...');
    setIsLoadingMoreMedia(true);
    
    try {
      // Calculate next page number
      const nextPage = mediaPage + 1;
      setMediaPage(nextPage);
      
      // Load media with the correct page number
      await loadUserMedia(false, nextPage);
    } catch (error) {
      console.error('❌ [ProfileScroll] Failed to load more media:', error);
      // Revert page increment on error
      setMediaPage(prev => Math.max(0, prev - 1));
    } finally {
      setIsLoadingMoreMedia(false);
    }
  };

  // 🚀 INFINITE SCROLL: Fallback mechanism - check if we need to load more when media changes
  useEffect(() => {
    if (userMedia.length > 0 && hasMoreMedia && !isLoadingMoreMedia && !isLoading) {
      // Check if the last item is visible (fallback for intersection observer)
      const lastItem = document.querySelector('[data-last-item="true"]');
      if (lastItem) {
        const rect = lastItem.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight + 200; // 200px buffer
        if (isVisible) {
          console.log('🚀 [ProfileScroll] Fallback: Last item visible, loading more...');
          loadMoreMedia();
        }
      }
    }
  }, [userMedia.length, hasMoreMedia, isLoadingMoreMedia, isLoading]);

  // 🚀 INFINITE SCROLL: Handle last item intersection
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleLastItemRef = (ref: HTMLDivElement | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    lastItemRef.current = ref;
    
    if (!ref) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreMedia && !isLoadingMoreMedia) {
          console.log('🚀 [ProfileScroll] Last item visible, loading more...');
          loadMoreMedia();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // Increased from 100px to trigger earlier
      }
    );
    
    observerRef.current.observe(ref);
  };

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Load profile data when component mounts and user is authenticated


  // Listen for user media updates from other components
  useEffect(() => {
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
      // Only refresh from server if explicitly requested AND user is authenticated
      if (e?.detail?.needsServerSync) {
        const user = authService.getCurrentUser()
        if (user) {
          loadUserMedia()
        } else {
          console.log('⚠️ [ProfileScreen] User not authenticated, skipping server sync')
        }
      }
      
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













  const handleDeleteAccount = async () => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      addNotification('Login Required', 'You must be logged in to delete your account', 'error')
      return
    }

    setIsDeletingAccount(true)

    try {
      console.log('🗑️ [Profile] User requesting account deletion:', currentUser.id)
      
      const response = await authenticatedFetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email || 'unknown'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [Profile] Account deleted successfully:', result)
        
        // Clear all user data
        localStorage.removeItem('token_usage')
        localStorage.removeItem('token_generations')
        localStorage.removeItem('referral_codes')
        
        // Log out the user
        authService.logout()
        
        // Show success message
        addNotification('Account Deleted', 'Your account has been permanently deleted', 'info')
        setShowDeleteAccountModal(false)
        
        // Redirect to home
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        const error = await response.json()
        console.error('❌ [Profile] Account deletion failed:', error)
        addNotification('Deletion Failed', 'Failed to delete account: ' + (error.error || 'Unknown error'), 'error')
      }
    } catch (error) {
      console.error('❌ [Profile] Account deletion error:', error)
      addNotification('Deletion Failed', 'Failed to delete account. Please try again.', 'error')
    } finally {
      setIsDeletingAccount(false)
    }
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
        
        // Update referral stats optimistically
        if (referralStats) {
          const updatedStats = { ...referralStats, invites: referralStats.invites + 1 }
          setReferralStats(updatedStats)
        }
        
        // Refresh stats from server to ensure accuracy
        setTimeout(async () => {
          try {
            const referralRes = await authenticatedFetch('/.netlify/functions/get-referral-stats', { method: 'GET' })
            if (referralRes.ok) {
              const response = await referralRes.json()
              if (response.success && response.stats) {
                setReferralStats({
                  invites: response.stats.totalReferrals || 0,
                  tokensEarned: response.stats.totalCreditsEarned || 0,
                  referralCode: response.stats.referralCode || ''
                })
                console.log('✅ [ProfileScreen] Referral stats refreshed after invite:', response.stats)
              }
            }
          } catch (error) {
            console.error('❌ [ProfileScreen] Failed to refresh referral stats:', error)
          }
        }, 1000)
        
        console.log('✅ [Invite] Invitation sent successfully')
      } else {
        // Handle specific validation errors
        let errorMessage = result.error || 'Failed to send invitation'
        
        if (result.error === 'REFERRAL_VALIDATION_FAILED') {
          errorMessage = 'Referral validation failed'
        } else if (result.error === 'ACCOUNT_LIMIT_EXCEEDED') {
          errorMessage = 'Too many accounts created from this IP address. Please try again later.'
        } else if (result.error === 'REFERRER_NOT_FOUND') {
          errorMessage = 'Referrer account not found. Please try again.'
        }
        
        setInviteError(errorMessage)
        console.log('❌ [Invite] Invitation failed:', errorMessage)
      }
    } catch (error) {
      console.error('Failed to send invite:', error)
      setInviteError('Failed to send invitation. Please try again.')
      console.log('❌ [Invite] Network error:', error)
    } finally {
      setIsSendingInvite(false)
    }
  }

  const sidebarItems = [
    { id: 'tokens', label: 'Tokens', icon: Coins },
    { id: 'invite-friends', label: 'Invite Friends', icon: Users },
    { id: 'total-likes', label: 'Total Likes', icon: Heart },
    
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
      console.log('💾 [User Settings] Updating share_to_feed to:', shareToFeed);
      const r = await authenticatedFetch('/.netlify/functions/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_to_feed: shareToFeed })
      })
      if (r.ok) {
        const s = await r.json()
        console.log('✅ [User Settings] Updated successfully:', s);
        updateProfile({ shareToFeed: !!s.settings?.share_to_feed })
        console.log('🔒 [Privacy] User share preference updated. Feed will reflect changes immediately.');
      } else {
        console.error('❌ [User Settings] Update failed:', r.status, r.statusText);
      }
    } catch (e) {
      console.error('❌ [User Settings] Update error:', e);
    }
  }

  return (
    <div className="min-h-screen bg-glossy-black-950 flex">
      {/* Sidebar - 20% */}
      <div className="w-[20%] bg-black p-4 fixed top-0 left-0 h-screen overflow-hidden flex flex-col">
        {/* Back Arrow - Top Left - Sticky */}
        <button 
          onClick={() => navigate('/')}
          className="sticky top-0 left-4 text-white/60 hover:text-white transition-colors duration-300 z-10 mb-2 bg-black/50 backdrop-blur-sm rounded-full p-2"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>



        {/* All Navigation Items in One Block */}
        <div className="flex-1 overflow-y-auto pt-2">
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

              if (item.id === 'total-likes') {
                return (
                  <div key={item.id} className="flex items-center justify-between py-1.5 px-3">
                    <div className="flex items-center space-x-2">
                      <Heart size={16} className="text-white/60" />
                      <span className="text-xs font-medium text-white/60">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-white">{Math.max(profileData.totalLikesReceived || 0, 0)}</span>
                  </div>
                )
              }


              
              // Handle toggle items
              if (item.type === 'toggle') {
                const settingValue = item.setting === 'autoShareToFeed' ? !!profileData.shareToFeed : false
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
                      {IconComponent && <IconComponent size={16} className="text-current" />}
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
                <XIconCustom size={18} className="text-white" />
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
      <div className="w-[80%] ml-[20%] bg-black h-screen overflow-y-auto flex flex-col">
        {/* Profile Controls - Top Right */}
        {/* Fixed Navigation Bar - Top Right */}
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
          {/* Hidden File Input */}
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
        {activeTab === 'tokens' && (
          <div className="flex-1 overflow-y-auto p-6 pt-24">
            <div className="max-w-4xl mx-auto">
            </div>
          </div>
        )}

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
                      onClick={downloadSelectedMedia}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/80 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDownloadingSelected}
                    >
                      {isDownloadingSelected ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Downloading...</span>
                        </div>
                      ) : (
                        `Download Selected (${selectedMediaIds.size})`
                      )}
                    </button>
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
                      onClick={downloadAllMedia}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600/80 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isDownloadingAll}
                    >
                      {isDownloadingAll ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Downloading All...</span>
                        </div>
                      ) : (
                        'Download All'
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
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
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
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Image size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No media yet</p>
              </div>
            ) : (
              <>
                <MasonryMediaGrid
                  media={userMedia.map(m => ({
                    ...m,
                    aspectRatio: m.width && m.height ? m.width / Math.max(1, m.height) : (m.aspectRatio || 4/3),
                    width: m.width || 800,
                    height: m.height || Math.round((m.width || 800) / (m.aspectRatio || 4/3))
                  }))}
                  columns={3}
                  onMediaClick={handleMediaClick}
                  onDownload={handleDownload}
                  onDelete={handleDeleteMedia}
                  showActions={true}
                  className="pb-20"
                  // Selection props
                  isSelectionMode={isSelectionMode}
                  selectedMediaIds={selectedMediaIds}
                  onToggleSelection={toggleMediaSelection}
                  // Enhanced loading states for actions
                  deletingMediaIds={deletingMediaIds}
                  // 🚀 INFINITE SCROLL: Connect intersection observer
                  onLastItemRef={handleLastItemRef}
                />
                
                {/* 🚀 INFINITE SCROLL: Loading indicator */}
                {isLoadingMoreMedia && hasMoreMedia && (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center space-x-3 text-white/60">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Loading more media...</span>
                    </div>
                  </div>
                )}
                
                {/* 🚀 INFINITE SCROLL: End of media indicator */}
                {!hasMoreMedia && userMedia.length > 0 && (
                  <div className="text-center py-8 text-white/40">
                    <p>You've reached the end of your media</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}





        {activeTab === 'draft' && (
          <div className="flex-1 overflow-y-auto p-6 pt-24">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <FileText size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">Loading your drafts...</p>
              </div>
            ) : (() => {
              console.log('🔍 Rendering draft tab:', { draftMediaLength: draftMedia.length, draftMedia: draftMedia, isLoading })
              return !isLoading && draftMedia.length === 0
            })() ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
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
                {isAuthenticated ? (
                  <div className="space-y-6">
                    {/* Benefits Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-white font-semibold mb-2 text-lg">You Get</div>
                        <div className="text-white/60">+10 credits after friend's first media</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-white font-semibold mb-2 text-lg">Friend Gets</div>
                        <div className="text-white/60">+10 credits on signup</div>
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
                        <div className="text-2xl font-bold text-white">{referralStats.invites || 0}</div>
                        <div className="text-white/60 text-sm">Friends Invited</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-white">{referralStats.tokensEarned || 0}</div>
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
                          value={currentEmail || 'user@example.com'}
                          disabled
                          className="flex-1 bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-3 text-white/60 cursor-not-allowed"
                        />
                        <button 
                          onClick={() => {
                            setShowChangeEmailModal(true)
                            setNewEmail('')
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

      {/* Email Change Modal */}
      {showChangeEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => {
              setShowChangeEmailModal(false)
              setNewEmail('')
            }}
          />
          <div className="relative bg-[#111111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">Change Email Address</h3>
              <button
                onClick={() => {
                  setShowChangeEmailModal(false)
                  setNewEmail('')
                  setOtpCode('')
                  setOtpSent(false)
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-white/80 text-sm">
                {otpSent 
                  ? `We've sent a verification code to ${newEmail}. Enter the code below to complete the change.`
                  : 'Enter your new email address below. We\'ll send a verification code to confirm the change.'
                }
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">New Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10"
                    disabled={isChangingEmail || otpSent}
                  />
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full bg-[#2a2a2a] border border-[#444444] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 text-center text-lg tracking-widest"
                      disabled={isChangingEmail}
                      maxLength={6}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowChangeEmailModal(false)
                    setNewEmail('')
                    setOtpCode('')
                    setOtpSent(false)
                  }}
                  disabled={isChangingEmail}
                  className="px-4 py-2 text-white rounded-lg transition-colors bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                
                {!otpSent ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || !newEmail.trim()}
                    className="px-4 py-2 text-black rounded-lg transition-colors bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {isSendingOtp ? "Sending..." : "Send Code"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setOtpSent(false)
                        setOtpCode('')
                      }}
                      className="px-4 py-2 text-white rounded-lg transition-colors bg-white/10 hover:bg-white/20"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleChangeEmail}
                      disabled={isChangingEmail || !otpCode.trim()}
                      className="px-4 py-2 text-black rounded-lg transition-colors bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {isChangingEmail ? "Updating..." : "Update Email"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                
                // Background refresh removed to prevent duplicate loading
                
                // Dispatch event to refresh the main feed
                window.dispatchEvent(new CustomEvent('refreshFeed'))
                console.log('🔄 Dispatched refreshFeed event to update main feed')
                
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
                <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-4">Delete Account</h1>
              
              {/* Warning Details */}
              <div className="text-center mb-4">
                <p className="text-white/80 text-sm mb-2 font-medium">This will permanently delete:</p>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• All your media and content</li>
                  <li>• Your account and profile</li>
                  <li>• All your data and settings</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeletingAccount ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting Account...</span>
                  </div>
                ) : (
                  'Delete Account Permanently'
                )}
              </button>
              
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isDeletingAccount}
                className="w-full bg-white/5 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
