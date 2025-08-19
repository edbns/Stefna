// src/services/profile.ts
import { authenticatedFetch } from '../utils/apiClient';
import authService from './authService';

export interface ProfileData {
  username?: string | null;
  avatar_url?: string | null;
  share_to_feed?: boolean;
  allow_remix?: boolean;
  onboarding_completed?: boolean;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  share_to_feed: boolean;
  allow_remix: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Ensure profile exists and update it with new data
 * Uses the existing update-profile Netlify function with JWT authentication
 */
export async function ensureAndUpdateProfile(profileData: ProfileData): Promise<Profile> {
  const token = authService.getToken();
  if (!token) {
    throw new Error('Not signed in');
  }

  const user = authService.getCurrentUser();
  if (!user?.id) {
    throw new Error('No user ID available');
  }

  console.log('🔄 Updating profile:', profileData);
  console.log('🔐 Auth debug:', { 
    userId: user.id, 
    hasToken: !!token, 
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    tokenParts: token ? token.split('.').length : 0
  });

  const response = await authenticatedFetch('/.netlify/functions/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });

  console.log('📡 update-profile response:', { 
    status: response.status, 
    ok: response.ok,
    statusText: response.statusText
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ update-profile failed:', errorData);
    throw new Error(errorData.error || 'Failed to update profile');
  }

  const result = await response.json();
  console.log('✅ Profile updated successfully:', result.profile);
  
  return result.profile;
}

/**
 * Get current user profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const token = authService.getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await authenticatedFetch('/.netlify/functions/get-user-profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Failed to get profile from server');
      return null;
    }

    const profileData = await response.json();
    
    // Handle new response format: { ok: true, profile: {...} }
    if (profileData.ok && profileData.profile) {
      return profileData.profile;
    }
    
    return profileData;
  } catch (error) {
    console.error('Error getting current profile:', error);
    return null;
  }
}

/**
 * Check if user needs onboarding
 */
export async function needsOnboarding(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return !profile?.onboarding_completed;
}

/**
 * Complete onboarding process
 */
export async function completeOnboarding(profileData: Omit<ProfileData, 'onboarding_completed'>): Promise<Profile> {
  return ensureAndUpdateProfile({
    ...profileData,
    onboarding_completed: true
  });
}

/**
 * Update sharing preferences
 */
export async function updateSharingPreferences(shareToFeed: boolean): Promise<Profile> {
  return ensureAndUpdateProfile({
    share_to_feed: shareToFeed
  });
}

/**
 * Update username (with validation)
 */
export async function updateUsername(username: string): Promise<Profile> {
  if (!username || !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    throw new Error('Username must be 3-30 characters, letters, numbers, underscores, and hyphens only');
  }
  
  // Additional validation rules
  if (username.startsWith('-')) {
    throw new Error('Username cannot start with a hyphen');
  }
  
  if (username.includes('---')) {
    throw new Error('Username cannot contain multiple consecutive hyphens');
  }

  return ensureAndUpdateProfile({
    username
  });
}

/**
 * Update avatar
 */
export async function updateAvatar(avatarUrl: string): Promise<Profile> {
  return ensureAndUpdateProfile({
    avatar_url: avatarUrl
  });
}

// ============================================================================
// LEGACY METHODS (Kept for backward compatibility)
// ============================================================================

/**
 * Legacy method names for backward compatibility
 */
export const updateMyProfile = ensureAndUpdateProfile;
export const getMyProfileDirect = getCurrentProfile;
export const ensureAndUpdateProfileDirect = ensureAndUpdateProfile;
