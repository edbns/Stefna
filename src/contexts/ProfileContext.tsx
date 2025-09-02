import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService from '../services/authService'
import { authenticatedFetch } from '../utils/apiClient'

interface ProfileData {
  id?: string
  name: string
  username?: string
  avatar: string | File | null
  shareToFeed: boolean
  // allowRemix removed
  onboarding_completed?: boolean
  createdAt?: string
}

interface ProfileContextType {
  profileData: ProfileData
  setProfileData: (data: ProfileData | ((prev: ProfileData) => ProfileData)) => void
  updateProfile: (updates: Partial<ProfileData>) => void
  refreshProfile: () => Promise<void>
  isLoading: boolean
}

const defaultProfileData: ProfileData = {
  id: '',
  name: '',
  username: '',
  avatar: '',
  shareToFeed: false, // 🔒 PRIVACY FIRST: Default to private so users control their sharing
  onboarding_completed: false,
  createdAt: new Date().toISOString()
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

interface ProfileProviderProps {
  children: ReactNode
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData)
  const [isLoading, setIsLoading] = useState(true)

  // Load profile data from database or localStorage
  const loadProfile = async () => {
    setIsLoading(true)
    try {
      // Check if we have a valid token before making API calls
      const token = authService.getToken()
      if (authService.isAuthenticated() && token) {
        console.log('🔐 Loading profile from database with token:', { 
          hasToken: !!token, 
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none' 
        })
        
        // Try to load from database first
        const response = await authenticatedFetch('/.netlify/functions/get-user-profile', {
          method: 'GET'
        })
        
        if (response.ok) {
          const userData = await response.json()
          console.log('✅ Loaded profile from database:', userData)
          
          // Load user settings to get the latest shareToFeed preference from database
          let shareToFeed = false // 🔒 PRIVACY FIRST: Default to private so users control their sharing
          try {
            const settingsResponse = await authenticatedFetch('/.netlify/functions/user-settings', {
              method: 'GET'
            })
            if (settingsResponse.ok) {
              const settings = await settingsResponse.json()
              console.log('🔍 [ProfileContext] Raw user settings response:', settings)
              shareToFeed = settings.settings?.share_to_feed ?? false
              console.log('✅ Loaded user settings share_to_feed from database:', shareToFeed)
            }
          } catch (settingsError) {
            console.warn('⚠️ Failed to load user settings from database:', settingsError)
            shareToFeed = false // Always default to private if database fails
          }
          
          const profileData = {
            id: userData.id,
            name: userData.name || userData.username || '',
            username: userData.username || '',
            avatar: userData.avatar || userData.avatar_url || '',
            shareToFeed: shareToFeed,
            // allowRemix removed
            onboarding_completed: userData.onboarding_completed || false,
            createdAt: userData.createdAt
          }
          
          setProfileData(profileData)
          
          // No localStorage for settings - database is the single source of truth
          return
        } else {
          console.warn('⚠️ Database profile load failed:', response.status, response.statusText)
        }
      } else {
        console.log('🔐 Skipping database profile load - no valid token or not authenticated')
      }
      
      // No localStorage fallback for settings - database only
      console.log('⚠️ Not authenticated or no token - using default profile settings')
    } catch (error) {
      console.error('❌ Failed to load profile:', error)
      
      // No localStorage fallback - database is single source of truth
      console.log('⚠️ Failed to load profile from database - using defaults')
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile data (database updates handled by ProfileScreen)
  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfileData(prev => {
      const updated = { ...prev, ...updates }
      
      console.log('🔄 Profile updated:', updates)
      
      // If shareToFeed is being updated, it should be persisted by ProfileScreen
      if (updates.shareToFeed !== undefined) {
        console.log('💾 shareToFeed updated - ProfileScreen should persist to database')
      }
      
      return updated
    })
  }

  // Refresh profile from server
  const refreshProfile = async () => {
    await loadProfile()
  }

  // Load profile on mount and when auth state changes
  useEffect(() => {
    // Wait for auth state to be fully initialized before trying to load profile
    const checkAuthAndLoad = () => {
      if (authService.isAuthenticated() && authService.getToken()) {
        loadProfile()
      } else {
        // If not authenticated, use default profile settings
        console.log('⚠️ Not authenticated - using default profile settings')
      }
    }

    // Add a small delay to ensure auth state is fully loaded
    const timer = setTimeout(checkAuthAndLoad, 200)
    
    return () => clearTimeout(timer)
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      if (authService.isAuthenticated()) {
        loadProfile()
      } else {
        // Reset to default when logged out
        setProfileData(defaultProfileData)
        // No localStorage to clean - database is single source of truth
      }
    }

    // Listen for custom auth events
    window.addEventListener('auth-state-changed', handleAuthChange)
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange)
    }
  }, [])

  const value: ProfileContextType = {
    profileData,
    setProfileData,
    updateProfile,
    refreshProfile,
    isLoading
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}
