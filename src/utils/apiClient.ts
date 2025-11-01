import authService from '../services/authService'

function getToken() {
  return authService.getAuthState().token || localStorage.getItem('auth_token') || localStorage.getItem('token')
}

// Show session expired alert and logout
function showSessionExpiredAlert() {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof alert !== 'undefined') {
    alert('Session Expired\n\nFor your security, please sign in again.')
  }
  
  // Use force logout for immediate effect
  authService.forceLogout()
}

export async function signedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const baseHeaders: Record<string, string> = {}
  
  // Add Authorization header if token exists
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`
  }
  
  // Add x-app-key header for Netlify Functions (required by aimlApi)
  const functionAppKey = import.meta.env.VITE_FUNCTION_APP_KEY
  if (functionAppKey) {
    baseHeaders['x-app-key'] = functionAppKey
  }

  const response = await fetch(url, { ...opts, headers: { ...baseHeaders, ...(opts.headers || {}) } })
  
  // Handle 401 errors with automatic token refresh
  if (response.status === 401 && token) {
    console.log('🔄 Received 401, attempting token refresh...')
    
    const refreshSuccess = await authService.refreshAccessToken()
    
    if (refreshSuccess) {
      // Retry the request with new token
      // IMPORTANT: Preserve the abort signal from original opts
      const newToken = getToken()
      if (newToken) {
        baseHeaders['Authorization'] = `Bearer ${newToken}`
        return fetch(url, { 
          ...opts, 
          headers: { ...baseHeaders, ...(opts.headers || {}) },
          signal: opts.signal // Preserve the abort signal for retry
        })
      }
    } else {
      // Refresh failed, show session expired alert
      console.log('🔐 Token refresh failed, showing session expired alert')
      showSessionExpiredAlert()
    }
  }
  
  return response
}

export async function authenticatedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  return signedFetch(url, opts)
}
