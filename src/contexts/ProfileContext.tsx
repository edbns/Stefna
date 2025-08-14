import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService from '../services/authService'
import { authenticatedFetch } from '../utils/apiClient'

interface ProfileData {
  id?: string
  name: string
  username?: string
  avatar: string | File | null
  shareToFeed: boolean
  allowRemix: boolean
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
  allowRemix: false
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
      if (authService.isAuthenticated()) {
        // Try to load from database first
        const response = await authenticatedFetch('/.netlify/functions/get-user-profile', {
          method: 'GET'
        })
        
        if (response.ok) {
          const userData = await response.json()
          console.log('✅ Loaded profile from database:', userData)
          
          const profileData = {
            id: userData.id,
            name: userData.name || userData.username || '',
            username: userData.username || '',
            avatar: userData.avatar || userData.avatar_url || '',
            shareToFeed: userData.shareToFeed || false,
            allowRemix: userData.allowRemix || false,
            onboarding_completed: userData.onboarding_completed || false,
            tier: userData.tier || 'registered',
            createdAt: userData.createdAt
          }
          
          setProfileData(profileData)
          
          // Also update localStorage for consistency and offline access
          localStorage.setItem('userProfile', JSON.stringify(profileData))
          return
        }
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
      return updated
    })
  }

  // Refresh profile from server
  const refreshProfile = async () => {
    await loadProfile()
  }

  // Load profile on mount and when auth state changes
  useEffect(() => {
    loadProfile()
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
