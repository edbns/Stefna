// src/services/authBootstrap.ts
import authService from './authService';
import { ensureAndUpdateProfile, needsOnboarding } from './profile';

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
          // The HomeNew component will handle showing the ProfileSetupModal
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
