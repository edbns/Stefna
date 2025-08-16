// src/services/profile.ts
import { signedFetch } from '../lib/auth';
import authService from './authService';
import { supabaseClient as supabase } from '../lib/supabaseClient';

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

  const response = await signedFetch('/.netlify/functions/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
// DIRECT SUPABASE METHODS (Alternative to Netlify Functions)
// ============================================================================

/**
 * Direct Supabase profile update (alternative to Netlify Functions)
 * Must be called with an authenticated session
 */
export async function updateMyProfile({
  username,
  avatarUrl,
  shareToFeed,
  allowRemix,
}: {
  username: string;
  avatarUrl: string | null;
  shareToFeed: boolean;
  allowRemix: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      username,
      avatar_url: avatarUrl,
      share_to_feed: shareToFeed,
      allow_remix: allowRemix,
      onboarding_completed: true, // Mark as completed when updating
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get current user profile directly from Supabase
 */
export async function getMyProfileDirect(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }

  return data;
}

/**
 * Ensure profile exists and update it with new data (direct Supabase)
 */
export async function ensureAndUpdateProfileDirect(profileData: Partial<ProfileData>): Promise<Profile> {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username: profileData.username ?? undefined,
        avatar_url: profileData.avatar_url ?? undefined,
        share_to_feed: profileData.share_to_feed,
        allow_remix: profileData.allow_remix,
        onboarding_completed: profileData.onboarding_completed,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
