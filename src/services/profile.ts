// src/services/profile.ts
import { signedFetch } from '../lib/auth';
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

  const response = await signedFetch('/.netlify/functions/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });

  if (!response.ok) {
    const errorData = await response.json();
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
    const response = await signedFetch('/.netlify/functions/get-user-profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Failed to get profile from server');
      return null;
    }

    const profileData = await response.json();
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
export async function updateSharingPreferences(shareToFeed: boolean, allowRemix: boolean): Promise<Profile> {
  return ensureAndUpdateProfile({
    share_to_feed: shareToFeed,
    allow_remix: shareToFeed ? allowRemix : false // Can't allow remix if not sharing
  });
}

/**
 * Update username (with validation)
 */
export async function updateUsername(username: string): Promise<Profile> {
  if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new Error('Username must be 3-30 characters, lowercase letters, numbers, and underscores only');
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
