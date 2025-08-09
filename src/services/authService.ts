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
    this.authState = {
      isAuthenticated: true,
      user,
      token
    }
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(user))
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

  // Test signin for development - bypasses OTP
  testSignin(userType: 'guest' | 'registered' | 'pro' = 'registered'): void {
    const testUser: User = {
      id: 'test-user-' + Date.now(),
      email: 'test@stefna.com',
      name: 'Test User',
      tier: userType
    }
    
    const testToken = 'test-token-' + Date.now()
    
    this.setAuthState(testToken, testUser)
    console.log('✅ Test signin successful:', testUser)
  }
}

export default AuthService.getInstance() 