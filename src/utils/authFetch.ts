// Auth fetch wrapper that handles 401 retries
import authService from '../services/authService'

export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  // Get current token
  const token = authService.getToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }

  // First attempt with current token
  let response = await fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      'Authorization': `Bearer ${token}`
    }
  })

  // If 401, try to refresh and retry once
  if (response.status === 401) {
    console.log('🔄 Auth token expired, attempting refresh...')
    
    try {
      // Try to get a fresh token (this depends on your auth implementation)
      const freshToken = await refreshAccessToken()
      
      if (freshToken) {
        // Retry with fresh token
        response = await fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            'Authorization': `Bearer ${freshToken}`
          }
        })
      }
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError)
      // If refresh fails, redirect to auth
      window.location.href = '/auth'
      throw new Error('Authentication failed')
    }
  }

  return response
}

// Helper to refresh access token
async function refreshAccessToken(): Promise<string | null> {
  try {
    // For OTP-based auth, we might need to check if the current session is still valid
    // or implement a refresh token mechanism
    
    // For now, check if current token is still valid by calling a lightweight endpoint
    const currentToken = authService.getToken()
    if (!currentToken) return null

    const testResponse = await fetch('/.netlify/functions/whoami', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    })

    if (testResponse.ok) {
      // Token is still valid
      return currentToken
    } else {
      // Token is invalid, clear it and redirect to auth
      authService.clearAuth()
      return null
    }
  } catch (error) {
    console.error('Token validation failed:', error)
    authService.clearAuth()
    return null
  }
}

// Export for backward compatibility with existing code
export { authFetch as authenticatedFetch }
