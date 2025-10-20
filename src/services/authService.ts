// Authentication Service - Handles OTP authentication state
// Note: JWT verification is handled on the backend only

export interface User {
  id: string
  email: string
  name: string
  tier: string
  permissions?: string[]
  platform?: string
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
  private tokenExpirationCheckInterval: NodeJS.Timeout | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private constructor() {
    this.loadAuthState()
    this.startTokenExpirationCheck()
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
          
          // Start token expiration checking when loading auth state
          this.startTokenExpirationCheck()
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
    
    // Start token expiration checking
    if (!wasAuthenticated) {
      this.startTokenExpirationCheck()
    }
    
    // Notify listeners if auth state changed
    if (!wasAuthenticated) {
      this.notifyAuthChange()
    }
  }

  // Handle Google OAuth callback
  handleGoogleCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');
    const errorMessage = urlParams.get('message');

    if (authStatus === 'success' && token) {
      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.userId,
          email: payload.email,
          name: payload.name || '',
          tier: 'free', // Default tier for Google OAuth users
          permissions: payload.permissions || [], // Preserve permissions from JWT
          platform: payload.platform || 'web'
        };

        this.setAuthState(token, user, refreshToken || undefined);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('🔐 Google OAuth login successful:', user);
      } catch (error) {
        console.error('Error processing Google OAuth token:', error);
        this.clearAuthState();
      }
    } else if (authStatus === 'error') {
      console.error('Google OAuth error:', errorMessage);
      this.clearAuthState();
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // Clear auth state on logout
  clearAuthState(): void {
    // Stop token expiration checking
    this.stopTokenExpirationCheck()
    
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

  // Decode JWT token and extract expiration time
  private getTokenExpiration(token: string): number | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const payload = JSON.parse(atob(parts[1]))
      return payload.exp ? payload.exp * 1000 : null // Convert to milliseconds
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    if (!this.authState.token) return true
    
    const expiration = this.getTokenExpiration(this.authState.token)
    if (!expiration) return false // Can't determine, assume valid
    
    const now = Date.now()
    const isExpired = now >= expiration
    
    if (isExpired) {
      console.log('🔐 Token has expired')
    }
    
    return isExpired
  }

  // Start automatic token expiration checking
  private startTokenExpirationCheck(): void {
    console.log('🔐 Starting token expiration check interval...')
    
    // Check every 30 seconds for faster detection
    this.tokenExpirationCheckInterval = setInterval(() => {
      console.log('🔐 Token expiration check running...', {
        isAuthenticated: this.authState.isAuthenticated,
        hasToken: !!this.authState.token,
        isExpired: this.isTokenExpired()
      })
      
      if (this.authState.isAuthenticated && this.isTokenExpired()) {
        console.log('🔐 Token expired, attempting to refresh...')
        this.handleTokenExpiration()
      }
    }, 30000) // Check every 30 seconds
    
    // Also do an immediate check
    if (this.authState.isAuthenticated && this.isTokenExpired()) {
      console.log('🔐 Token expired on startup, attempting to refresh...')
      this.handleTokenExpiration()
    }
  }

  // Stop automatic token expiration checking
  private stopTokenExpirationCheck(): void {
    if (this.tokenExpirationCheckInterval) {
      clearInterval(this.tokenExpirationCheckInterval)
      this.tokenExpirationCheckInterval = null
    }
  }

  // Handle token expiration - try to refresh, otherwise logout
  private async handleTokenExpiration(): Promise<void> {
    try {
      // Try to refresh the token
      const refreshed = await this.refreshAccessToken()
      
      if (refreshed) {
        console.log('✅ Token refreshed successfully')
        return
      }
      
      // If refresh failed, logout the user
      console.log('❌ Token refresh failed, logging out user')
      this.handleSessionExpired()
    } catch (error) {
      console.error('Error handling token expiration:', error)
      this.handleSessionExpired()
    }
  }

  // Force logout - for immediate logout when 401 is detected
  forceLogout(): void {
    console.log('🔐 Force logout triggered')
    this.handleSessionExpired()
  }

  // Handle session expired - show alert and logout
  private handleSessionExpired(): void {
    // Stop checking for expiration
    this.stopTokenExpirationCheck()
    
    // Clear auth state
    this.clearAuthState()
    
    // Notify listeners
    this.notifyAuthChange()
    
    // Show alert to user
    if (typeof window !== 'undefined' && typeof alert !== 'undefined') {
      alert('Session Expired\n\nFor your security, please sign in again.')
    }
    
    // Redirect to auth page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth'
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