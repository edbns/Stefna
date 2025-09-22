// Development-only authentication helper
// This bypasses the OTP system for local development

import authService from '../services/authService'

export interface DevUser {
  id: string
  email: string
  name: string | null
}

// Mock JWT token for development
const DEV_JWT_TOKEN = 'dev-jwt-token-for-testing-purposes-only'

// Test user data
const TEST_USER: DevUser = {
  id: 'dev-user-123',
  email: 'test@stefna.ai',
  name: 'Test User'
}

/**
 * Create a mock authentication for development
 * This bypasses the OTP system entirely
 */
export function createDevAuth(): boolean {
  if (import.meta.env.PROD) {
    console.warn('⚠️ Dev auth is only available in development mode')
    return false
  }

  try {
    // Set the auth state with mock data
    authService.setAuthState(DEV_JWT_TOKEN, TEST_USER)
    
    console.log('🔧 Development authentication created:', {
      user: TEST_USER.email,
      id: TEST_USER.id
    })
    
    return true
  } catch (error) {
    console.error('❌ Failed to create dev auth:', error)
    return false
  }
}

/**
 * Check if we're in development mode and can use dev auth
 */
export function canUseDevAuth(): boolean {
  return import.meta.env.DEV
}

/**
 * Get the test user data
 */
export function getTestUser(): DevUser {
  return TEST_USER
}

/**
 * Clear dev authentication
 */
export function clearDevAuth(): void {
  if (import.meta.env.DEV) {
    authService.clearAuthState()
    console.log('🔧 Development authentication cleared')
  }
}
