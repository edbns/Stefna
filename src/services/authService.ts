// Authentication Service - Handles OTP authentication state
// Note: JWT verification is handled on the backend only

export interface User {
  id: string
  email: string
  name: string
  tier: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null
}

class AuthService {
  private static instance: AuthService
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null
  }
  private authChangeListeners: ((authState: AuthState) => void)[] = []

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private constructor() {
    this.loadAuthState()
  }

  // Load auth state from localStorage
  private loadAuthState(): void {
    try {
      const token = localStorage.getItem('auth_token')
      const refreshToken = localStorage.getItem('refresh_token')
      const userData = localStorage.getItem('user_data')

      console.log('🔐 loadAuthState:', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken,
        tokenType: typeof token,
        tokenPreview: token ? `${token.substring(0, 50)}...` : 'none',
        hasUserData: !!userData
      });

      if (token && userData) {
        // Basic token validation (expiration check handled on backend)
        try {
          const user = JSON.parse(userData)
          this.authState = {
            isAuthenticated: true,
            user,
            token,
            refreshToken: refreshToken || null
          }
          console.log('🔐 Auth state loaded successfully:', { 
            isAuthenticated: this.authState.isAuthenticated,
            hasUser: !!this.authState.user,
            tokenType: typeof this.authState.token
          });
        } catch (error) {
          console.error('Error parsing user data:', error)
          this.clearAuthState()
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error)
      this.clearAuthState()
    }
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authState.user
  }

  // Get auth token
  getToken(): string | null {
    const token = this.authState.token;
    console.log('🔐 getToken called:', { 
      hasToken: !!token, 
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      tokenParts: token ? token.split('.').length : 0,
      tokenType: typeof token
    });
    return token;
  }

  // Set auth state after successful login
  setAuthState(accessToken: string, user: User, refreshToken?: string): void {
    console.log('🔐 setAuthState called:', { 
      tokenType: typeof accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 50)}...` : 'none',
      userType: typeof user,
      hasUser: !!user,
      hasRefreshToken: !!refreshToken
    });
    
    const wasAuthenticated = this.authState.isAuthenticated
    
    this.authState = {
      isAuthenticated: true,
      user,
      token: accessToken,
      refreshToken: refreshToken || null
    }
    localStorage.setItem('auth_token', accessToken)
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    localStorage.setItem('user_data', JSON.stringify(user))
    
    console.log('🔐 Auth state set successfully:', { 
      isAuthenticated: this.authState.isAuthenticated,
      hasUser: !!this.authState.user,
      tokenType: typeof this.authState.token
    });
    
    // Notify listeners if auth state changed
    if (!wasAuthenticated) {
      this.notifyAuthChange()
    }
  }

  // Clear auth state on logout
  clearAuthState(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.authState.refreshToken || localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        console.log('🔐 No refresh token available')
        return false
      }

      console.log('🔄 Attempting to refresh access token...')
      
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) {
        console.log('🔐 Token refresh failed:', response.status)
        return false
      }

      const data = await response.json()
      
      if (data.success && data.accessToken) {
        // Update the access token
        this.authState.token = data.accessToken
        localStorage.setItem('auth_token', data.accessToken)
        
        console.log('✅ Access token refreshed successfully')
        return true
      }
      
      return false
    } catch (error) {
      console.error('🔐 Token refresh error:', error)
      return false
    }
  }

  // Logout user
  logout(): void {
    try {
      fetch('/.netlify/functions/logout', { method: 'POST' }).catch(() => {})
    } finally {
      this.clearAuthState()
      // Notify listeners of auth state change
      this.notifyAuthChange()
      // Dispatch global auth state change event for components that listen for it
      window.dispatchEvent(new CustomEvent('auth-state-changed'))
    }
  }

  // Get authenticated headers for API calls
  getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authState.token}`
    }
  }

  // Verify token is valid (basic check, full validation on backend)
  isTokenValid(): boolean {
    if (!this.authState.token) return false
    
    try {
      // Basic token format validation
      const parts = this.authState.token.split('.')
      return parts.length === 3
    } catch {
      return false
    }
  }

  // Refresh auth state (call this on app start)
  refreshAuthState(): void {
    this.loadAuthState()
  }

  // Add auth state change listener
  onAuthStateChange(callback: (authState: AuthState) => void): () => void {
    this.authChangeListeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.authChangeListeners.indexOf(callback)
      if (index > -1) {
        this.authChangeListeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners of auth state change
  private notifyAuthChange(): void {
    this.authChangeListeners.forEach(callback => {
      try {
        callback(this.authState)
      } catch (error) {
        console.error('Error in auth state change listener:', error)
      }
    })
  }

}

export default AuthService.getInstance() 