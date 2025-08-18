// Authentication Service - Handles OTP authentication state
// Note: JWT verification is handled on the backend only
class AuthService {
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    constructor() {
        Object.defineProperty(this, "authState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                isAuthenticated: false,
                user: null,
                token: null
            }
        });
        Object.defineProperty(this, "authChangeListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.loadAuthState();
    }
    // Load auth state from localStorage
    loadAuthState() {
        try {
            const token = localStorage.getItem('auth_token');
            const userData = localStorage.getItem('user_data');
            console.log('🔐 loadAuthState:', {
                hasToken: !!token,
                tokenType: typeof token,
                tokenPreview: token ? `${token.substring(0, 50)}...` : 'none',
                hasUserData: !!userData
            });
            if (token && userData) {
                // Basic token validation (expiration check handled on backend)
                try {
                    const user = JSON.parse(userData);
                    this.authState = {
                        isAuthenticated: true,
                        user,
                        token
                    };
                    console.log('🔐 Auth state loaded successfully:', {
                        isAuthenticated: this.authState.isAuthenticated,
                        hasUser: !!this.authState.user,
                        tokenType: typeof this.authState.token
                    });
                }
                catch (error) {
                    console.error('Error parsing user data:', error);
                    this.clearAuthState();
                }
            }
        }
        catch (error) {
            console.error('Error loading auth state:', error);
            this.clearAuthState();
        }
    }
    // Get current auth state
    getAuthState() {
        return { ...this.authState };
    }
    // Check if user is authenticated
    isAuthenticated() {
        return this.authState.isAuthenticated;
    }
    // Get current user
    getCurrentUser() {
        return this.authState.user;
    }
    // Get auth token
    getToken() {
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
    setAuthState(token, user) {
        console.log('🔐 setAuthState called:', {
            tokenType: typeof token,
            tokenPreview: token ? `${token.substring(0, 50)}...` : 'none',
            userType: typeof user,
            hasUser: !!user
        });
        const wasAuthenticated = this.authState.isAuthenticated;
        this.authState = {
            isAuthenticated: true,
            user,
            token
        };
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        console.log('🔐 Auth state set successfully:', {
            isAuthenticated: this.authState.isAuthenticated,
            hasUser: !!this.authState.user,
            tokenType: typeof this.authState.token
        });
        // Notify listeners if auth state changed
        if (!wasAuthenticated) {
            this.notifyAuthChange();
        }
    }
    // Clear auth state on logout
    clearAuthState() {
        this.authState = {
            isAuthenticated: false,
            user: null,
            token: null
        };
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }
    // Logout user
    logout() {
        try {
            fetch('/.netlify/functions/logout', { method: 'POST' }).catch(() => { });
        }
        finally {
            this.clearAuthState();
            // Notify listeners of auth state change
            this.notifyAuthChange();
            // Dispatch global auth state change event for components that listen for it
            window.dispatchEvent(new CustomEvent('auth-state-changed'));
        }
    }
    // Get authenticated headers for API calls
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authState.token}`
        };
    }
    // Verify token is valid (basic check, full validation on backend)
    isTokenValid() {
        if (!this.authState.token)
            return false;
        try {
            // Basic token format validation
            const parts = this.authState.token.split('.');
            return parts.length === 3;
        }
        catch {
            return false;
        }
    }
    // Refresh auth state (call this on app start)
    refreshAuthState() {
        this.loadAuthState();
    }
    // Add auth state change listener
    onAuthStateChange(callback) {
        this.authChangeListeners.push(callback);
        // Return unsubscribe function
        return () => {
            const index = this.authChangeListeners.indexOf(callback);
            if (index > -1) {
                this.authChangeListeners.splice(index, 1);
            }
        };
    }
    // Notify all listeners of auth state change
    notifyAuthChange() {
        this.authChangeListeners.forEach(callback => {
            try {
                callback(this.authState);
            }
            catch (error) {
                console.error('Error in auth state change listener:', error);
            }
        });
    }
}
export default AuthService.getInstance();
