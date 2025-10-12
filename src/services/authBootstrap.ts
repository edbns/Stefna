// src/services/authBootstrap.ts
import authService from './authService';
import { ensureAndUpdateProfile, needsOnboarding } from './profile';
import { UserMediaItem as UserMedia } from '../types/media';
import { authenticatedFetch } from '../utils/apiClient';

let isBootstrapInitialized = false;

/**
 * Initialize auth state change listeners
 * Call this once when the app starts
 */
export function initializeAuthBootstrap(): void {
  if (isBootstrapInitialized) {
    return;
  }

  console.log('🔧 Initializing auth bootstrap...');

  // Listen for auth state changes
  authService.onAuthStateChange(async (authState) => {
    if (authState.isAuthenticated && authState.user) {
      console.log('🔐 User signed in, checking profile setup...');
      
      try {
        // Check if user needs onboarding
        const needsSetup = await needsOnboarding();
        
        if (needsSetup) {
          console.log('🎯 User needs onboarding - modal will be shown by HomeNew component');
          // Profile setup will be handled through the edit profile modal
        } else {
          console.log('✅ User profile is complete');
        }
        
        // Optionally ensure profile exists with minimal data
        // This creates a profile record if it doesn't exist
        await ensureAndUpdateProfile({});
        
      } catch (error) {
        console.error('❌ Error during auth bootstrap:', error);
      }
    } else {
      console.log('🔓 User signed out');
    }
  });

  isBootstrapInitialized = true;
  console.log('✅ Auth bootstrap initialized');
}

/**
 * Manual trigger for profile setup check
 * Useful for testing or manual triggers
 */
export async function checkAndTriggerOnboarding(): Promise<boolean> {
  const authState = authService.getAuthState();
  
  if (!authState.isAuthenticated) {
    console.log('❌ User not authenticated, cannot check onboarding');
    return false;
  }

  try {
    const needsSetup = await needsOnboarding();
    console.log(`🎯 Onboarding check: ${needsSetup ? 'needed' : 'complete'}`);
    return needsSetup;
  } catch (error) {
    console.error('❌ Error checking onboarding status:', error);
    return false;
  }
}

// Bootstrap authentication and user state
export async function bootstrapAuth() {
  console.log('🔐 [AuthBootstrap] Starting authentication bootstrap...')
  
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token')
    if (!token) {
      console.log('🔐 [AuthBootstrap] No auth token found, user not authenticated')
      return { isAuthenticated: false, user: null }
    }

    // Validate token and get user info
    const response = await authenticatedFetch('/.netlify/functions/get-user-profile', {
      method: 'GET'
    })

    if (response.ok) {
      const user = await response.json()
      console.log('✅ [AuthBootstrap] User authenticated:', user.id)
      return { isAuthenticated: true, user }
    } else {
      console.log('❌ [AuthBootstrap] Token validation failed')
      localStorage.removeItem('auth_token')
      return { isAuthenticated: false, user: null }
    }
  } catch (error) {
    console.error('❌ [AuthBootstrap] Error during bootstrap:', error)
    return { isAuthenticated: false, user: null }
  }
}
