import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Image, Heart, FileText, Bell, Settings, Shield, Cookie, ArrowLeft, LogOut, X, User, Globe, Zap, Users, Check, Copy, Gift, RefreshCw } from 'lucide-react'
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
import AdminUpgrade from '../components/AdminUpgrade'

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<string>('all-media')
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [profileData, setProfileData] = useState({
    name: 'User Name',
    bio: 'AI artist exploring the boundaries of creativity 🎨',
    photo: null as File | string | null,
    shareToFeed: true,
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

  // Load profile data from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile)
        setProfileData(prev => ({ ...prev, ...parsedProfile }))
      } catch (error) {
        console.error('Failed to load profile data:', error)
      }
    }
  }, [])
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
  const [userTier, setUserTier] = useState<UserTier>(UserTier.REGISTERED)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showInviteFriendsModal, setShowInviteFriendsModal] = useState(false)
  const [referralStats, setReferralStats] = useState<{ invites: number; tokensEarned: number; referralCode: string } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
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
          const tokenUsage = await tokenService.getUserUsage(userId)
          const expectedLimit = currentTier === UserTier.CONTRIBUTOR ? 410 : 
                               currentTier === UserTier.VERIFIED ? 215 : 115
          
          // If the limit doesn't match the tier, update it
          if (tokenUsage.dailyLimit !== expectedLimit) {
            await tokenService.updateUserTier(userId, currentTier)
            const updatedUsage = await tokenService.getUserUsage(userId)
            setTokenCount(updatedUsage.dailyLimit - updatedUsage.dailyUsage)
          } else {
            setTokenCount(tokenUsage.dailyLimit - tokenUsage.dailyUsage)
          }
        } catch (error) {
          console.error('Failed to load referral stats or token count:', error)
          // Set default token count based on tier
          const defaultLimit = currentTier === UserTier.CONTRIBUTOR ? 410 : 
                             currentTier === UserTier.VERIFIED ? 215 : 115
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
            const transformedMedia: UserMedia[] = dbMedia.map((item: any) => ({
              id: item.id,
              userId: item.user_id,
              type: item.resource_type === 'video' ? 'video' : 'photo',
              url: item.result_url || item.url, // Use result_url if available, fallback to url
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
            }));
            
            setUserMedia(transformedMedia);
          } else {
            console.error('Failed to load user media from database:', response.statusText);
            // Fallback to local service if database fails
            const allMedia = await userMediaService.getAllUserMedia(userId);
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
      setRemixedMedia(remixes)

      // Load liked media (for now, empty - will be implemented with database)
      setLikedMedia([])

      // Load draft media (empty for now - will be populated when users create drafts)
      setDraftMedia([])

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
    }
    
    window.addEventListener('userMediaUpdated', handleUserMediaUpdated)
    
    return () => {
      window.removeEventListener('userMediaUpdated', handleUserMediaUpdated)
    }
  }, [])

  // Manual media recovery function
  const handleRecoverMedia = async () => {
    try {
      setIsLoading(true)
      const recoveredMedia = await userMediaService.recoverMedia(currentUserId)
      if (recoveredMedia.length > 0) {
        setUserMedia(recoveredMedia)
        addNotification('Media Recovered', `Successfully recovered ${recoveredMedia.length} media items!`, 'success')
      } else {
        addNotification('No Media Found', 'No recoverable media was found.', 'info')
      }
    } catch (error) {
      console.error('Failed to recover media:', error)
      addNotification('Recovery Failed', 'Failed to recover media. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfileData(prev => ({ ...prev, photo: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    // Convert photo file to base64 if it exists
    const profileDataToSave = { ...profileData }
    if (profileData.photo instanceof File && previewPhoto) {
      profileDataToSave.photo = previewPhoto // Save as base64 string
    }
    
    // Save profile data to local storage (in real app, would save to backend)
    localStorage.setItem('userProfile', JSON.stringify(profileDataToSave))
    addNotification('Profile Updated', 'Your profile has been saved successfully', 'success')
    setShowEditProfileModal(false)
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

  const handleDownload = (media: UserMedia) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = media.url
    link.download = `stefna-${media.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Updated share function that updates database visibility
  const handleShare = async (media: UserMedia) => {
    try {
      // Update media visibility in database
        const response = await fetch('/.netlify/functions/updateMediaVisibility', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken() || localStorage.getItem('auth_token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: media.id,
          visibility: 'public',
          allowRemix: media.allowRemix
        })
      })

      if (response.ok) {
        const updatedMedia = await response.json()
        
        // Update local state
        setUserMedia(prev => prev.map(item => 
          item.id === media.id 
            ? { ...item, isPublic: true, allowRemix: updatedMedia.allow_remix }
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



  // Unified notification functions (same as home page)
  const addNotification = (title: string, message?: string, type: 'success' | 'info' | 'warning' | 'error' | 'processing' | 'complete' | 'system' = 'info', mediaUrl?: string, mediaType?: 'image' | 'video', persistent?: boolean) => {
    const notification = {
      id: Date.now(),
      title,
      message: message || '',
      type,
      timestamp: new Date().toISOString(),
      mediaUrl,
      mediaType,
      persistent
    }
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications
    if (!persistent && type !== 'error') {
      const autoRemoveTime = type === 'processing' ? 30000 : type === 'system' ? 10000 : 8000
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, autoRemoveTime)
    }
    console.log(`${type.toUpperCase()}: ${title} - ${message}`)
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

  // Invite Friends functionality
  const [inviteEmail, setInviteEmail] = useState('')
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

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
                    const newShareToFeed = !profileData.shareToFeed
                    const updatedProfileData = { 
                      ...profileData, 
                      shareToFeed: newShareToFeed,
                      // If turning off share to feed, also turn off allow remix
                      allowRemix: newShareToFeed ? profileData.allowRemix : false
                    }
                    setProfileData(updatedProfileData)
                    // Save to localStorage immediately
                    localStorage.setItem('userProfile', JSON.stringify(updatedProfileData))
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
                      const updatedProfileData = { ...profileData, allowRemix: !profileData.allowRemix }
                      setProfileData(updatedProfileData)
                      // Save to localStorage immediately
                      localStorage.setItem('userProfile', JSON.stringify(updatedProfileData))
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

            {/* Token Display */}
            <div className="space-y-1">
              <div className="flex items-center justify-between py-1.5 px-3 rounded-lg text-left transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Zap size={16} className="text-white/60" />
                  <span className="text-xs font-medium text-white/60">Tokens</span>
                </div>
                <span className="text-white font-semibold">{tokenCount}</span>
              </div>
            </div>

            {/* Invite Friends */}
            <button
              onClick={() => setShowInviteFriendsModal(true)}
              className="w-full py-1.5 px-3 rounded-lg text-left transition-all duration-300 flex items-center justify-between text-white/60 hover:text-white hover:bg-white/10"
            >
              <div className="flex items-center space-x-2">
                <Users size={16} />
                <span className="text-xs font-medium">Invite Friends</span>
              </div>
            </button>

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
                        className="w-full py-1.5 px-3 rounded-lg text-left transition-all duration-300 flex items-center justify-start space-x-3 text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                          <User size={16} className="text-current" />
                        </div>
                        <span className="text-xs font-medium">Edit Profile</span>
                      </button>
                      <button 
                        onClick={handleRecoverMedia}
                        className="w-full py-1.5 px-3 rounded-lg text-left transition-all duration-300 flex items-center justify-start space-x-3 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/20"
                      >
                        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                          <RefreshCw size={16} className="text-current" />
                        </div>
                        <span className="text-xs font-medium">Recover Media</span>
                      </button>
                      <button 
                        onClick={() => setShowAdminUpgrade(true)}
                        className="w-full py-1.5 px-3 rounded-lg text-left transition-all duration-300 flex items-center justify-start space-x-3 text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-500/20"
                      >
                        <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                          <Zap size={16} className="text-current" />
                        </div>
                        <span className="text-xs font-medium">Admin Upgrade</span>
                      </button>
                      <button 
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="w-full py-1.5 px-3 rounded-lg text-left transition-all duration-300 flex items-center justify-start space-x-3 text-red-400/60 hover:text-red-400 hover:bg-red-500/20"
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
                <InstagramIcon className="text-white" />
              </a>
              <a
                href="https://x.com/StefnaXYZ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="X"
              >
                <XIcon className="text-white" />
              </a>
              <a
                href="https://www.facebook.com/Stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="Facebook"
              >
                <FacebookIcon className="text-white" />
              </a>
              <a
                href="https://www.tiktok.com/@stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="TikTok"
              >
                <TikTokIcon className="text-white" />
              </a>
              <a
                href="https://www.threads.net/@stefnaxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
                title="Threads"
              >
                <ThreadsIcon className="text-white" />
              </a>
              <a href="https://www.youtube.com/channel/UCNBAWuWc8luYN8F0dIXX0RA" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90" title="YouTube">
                <YouTubeIcon className="text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area - 80% */}
      <div className="w-[80%] bg-black h-screen overflow-y-auto flex flex-col relative">
        {/* Notification System */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2" style={{ right: '20%' }}>
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`max-w-sm bg-gray-900 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
                  notification.type === 'complete' ? 'cursor-pointer hover:bg-gray-800' : ''
                }`}
                onClick={() => {
                  if (notification.type === 'complete' && notification.mediaUrl) {
                    console.log('Opening completed media:', notification.mediaUrl)
                  }
                }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      {notification.message && (
                        <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                      className="text-gray-400 hover:text-white transition-colors ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {notification.mediaUrl && (
                    <div className="mt-3 flex items-center space-x-3">
                      <img 
                        src={notification.mediaUrl} 
                        alt="Generated content" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      {notification.type === 'complete' && (
                        <div className="flex items-center space-x-2">
                          <Check size={16} className="text-green-400" />
                          <span className="text-xs text-gray-300">Ready to view</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Content based on active tab */}
        {activeTab === 'all-media' && (
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Image size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">Loading your media...</p>
              </div>
            ) : userMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <Image size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No media yet</p>
                <p className="text-white/40 text-sm text-center mt-2">Your created media will appear here</p>
              </div>
            ) : (
              <MasonryMediaGrid
                media={userMedia}
                columns={3}
                onMediaClick={handleMediaClick}
                onDownload={handleDownload}
                onShare={handleShare}
                onRemix={handleRemix}
                onDelete={handleDeleteMedia}
                showActions={true}
                className="pb-20"
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
            ) : likedMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <Heart size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No liked media yet</p>
                <p className="text-white/40 text-sm text-center mt-2">Like media to see it here</p>
              </div>
            ) : (
              <MasonryMediaGrid
                media={likedMedia}
                columns={3}
                onMediaClick={handleMediaClick}
                onDownload={handleDownload}
                onShare={handleShare}
                onLike={handleLike}
                onRemix={handleRemix}
                showActions={true}
                className="pb-20"
                isLikedMedia={true}
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
            ) : remixedMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <RemixIcon size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No remixes yet</p>
                <p className="text-white/40 text-sm text-center mt-2">Your remixed media will appear here</p>
              </div>
            ) : (
              <MasonryMediaGrid
                media={remixedMedia}
                columns={3}
                onMediaClick={handleMediaClick}
                onDownload={handleDownload}
                onShare={handleShare}
                onRemix={handleRemix}
                onDelete={handleDeleteMedia}
                showActions={true}
                className="pb-20"
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
            ) : draftMedia.length === 0 ? (
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
                showActions={true}
                className="pb-20"
              />
            )}
          </div>
        )}

        {activeTab === 'notification' && (
          <div className="flex-1 overflow-y-auto p-6">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <Bell size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg text-center">No notifications yet</p>
                <p className="text-white/40 text-sm text-center mt-2">Notifications will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-white text-xl font-semibold mb-6">Notifications</h2>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white/10 backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300 hover:bg-white/15 ${
                      notification.type === 'complete' ? 'cursor-pointer hover:bg-white/20' : ''
                    } ${
                      notification.type === 'error' ? 'border-red-500/30' :
                      notification.type === 'warning' ? 'border-yellow-500/30' :
                      notification.type === 'success' ? 'border-green-500/30' :
                      'border-white/20'
                    }`}
                    onClick={() => {
                      if (notification.type === 'complete' && notification.mediaUrl) {
                        // Handle media completion notification click
                        console.log('Opening completed media:', notification.mediaUrl)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'complete' ? 'bg-blue-500' :
                            'bg-white/60'
                          }`} />
                          <span className="text-white font-medium text-sm">{notification.title}</span>
                          <span className="text-white/40 text-xs">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {notification.message && (
                          <p className="text-white/70 text-sm">{notification.message}</p>
                        )}
                        {notification.mediaUrl && (
                          <div className="mt-3">
                            <img 
                              src={notification.mediaUrl} 
                              alt="Generated content" 
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="text-white/40 hover:text-white transition-colors ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            // Check if this is a draft
            const isDraft = draftMedia.some(draft => draft.id === confirm.media?.id)
            
            if (isDraft) {
              // Delete from drafts
              setDraftMedia(prev => prev.filter(item => item.id !== confirm.media?.id))
              addNotification('Draft Deleted', 'Draft removed from collection', 'info')
            } else {
              // Delete from regular media
              await userMediaService.deleteMedia(currentUserId, confirm.media.id)
              const allMedia = await userMediaService.getAllUserMedia(currentUserId)
              setUserMedia(allMedia)
            }
          }
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
                  <p className="text-white/60 text-sm">+50 bonus tokens for each friend who signs up</p>
                </div>

                {/* What your friends get */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2 text-sm">Your friends get</h3>
                  <p className="text-white/60 text-sm">+25 bonus tokens when they sign up with your invite</p>
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

      {/* Admin Upgrade Modal */}
      {showAdminUpgrade && (
        <AdminUpgrade onClose={() => setShowAdminUpgrade(false)} />
      )}
    </div>
  )
}
export default ProfileScreen
