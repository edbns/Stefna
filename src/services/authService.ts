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
}

class AuthService {
  private static instance: AuthService
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
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
      const userData = localStorage.getItem('user_data')

      if (token && userData) {
        // Basic token validation (expiration check handled on backend)
        try {
          const user = JSON.parse(userData)
          this.authState = {
            isAuthenticated: true,
            user,
            token
          }
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
    return this.authState.token
  }

  // Set auth state after successful login
  setAuthState(token: string, user: User): void {
    const wasAuthenticated = this.authState.isAuthenticated
    
    this.authState = {
      isAuthenticated: true,
      user,
      token
    }
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(user))
    
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
      token: null
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  // Logout user
  logout(): void {
    try {
      fetch('/.netlify/functions/logout', { method: 'POST' }).catch(() => {})
    } finally {
      this.clearAuthState()
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