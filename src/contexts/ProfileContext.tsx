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
  tier?: string
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
  name: 'User Name',
  avatar: null,
  shareToFeed: false,
  // allowRemix removed
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
          
          // Also load user settings to get the latest shareToFeed preference
          let shareToFeed = true // default value
          try {
            const settingsResponse = await authenticatedFetch('/.netlify/functions/user-settings', {
              method: 'GET'
            })
            if (settingsResponse.ok) {
              const settings = await settingsResponse.json()
              shareToFeed = settings.shareToFeed
              console.log('✅ Loaded user settings:', settings)
            }
          } catch (settingsError) {
            console.warn('⚠️ Failed to load user settings, using profile data:', settingsError)
            shareToFeed = userData.share_to_feed !== undefined ? userData.share_to_feed : true
          }
          
          const profileData = {
            id: userData.id,
            name: userData.name || userData.username || '',
            username: userData.username || '',
            avatar: userData.avatar || userData.avatar_url || '',
            shareToFeed: shareToFeed,
            // allowRemix removed
            onboarding_completed: userData.onboarding_completed || false,
            tier: userData.tier || 'registered',
            createdAt: userData.createdAt
          }
          
          setProfileData(profileData)
          
          // Also update localStorage for consistency and offline access
          localStorage.setItem('userProfile', JSON.stringify(profileData))
          return
        } else {
          console.warn('⚠️ Database profile load failed:', response.status, response.statusText)
        }
      } else {
        console.log('🔐 Skipping database profile load - no valid token or not authenticated')
      }
      
      // Fallback to localStorage
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile)
        setProfileData(prev => ({ ...prev, ...parsedProfile }))
        console.log('✅ Loaded profile from localStorage:', parsedProfile)
      }
    } catch (error) {
      console.error('❌ Failed to load profile:', error)
      
      // Fallback to localStorage on error
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          setProfileData(prev => ({ ...prev, ...parsedProfile }))
        } catch (parseError) {
          console.error('Failed to parse localStorage profile:', parseError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile data and sync to localStorage
  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfileData(prev => {
      const updated = { ...prev, ...updates }
      
      // Sync to localStorage
      localStorage.setItem('userProfile', JSON.stringify(updated))
      
      console.log('🔄 Profile updated:', updates)
      
      // If shareToFeed is being updated, ensure it's also saved to the database
      if (updates.shareToFeed !== undefined) {
        console.log('💾 shareToFeed updated, ensuring database persistence...')
        // Don't reload profile immediately to avoid race conditions
        // The ProfileScreen will handle the database update via updateUserSettings
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
    // Add a small delay to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      loadProfile()
    }, 100)
    
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
        localStorage.removeItem('userProfile')
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
