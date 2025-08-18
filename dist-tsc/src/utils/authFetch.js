// Auth fetch wrapper that handles 401 retries
import authService from '../services/authService';
import { getAuthHeaders } from '../lib/auth';
export async function authFetch(input, init = {}) {
    // Get current token
    const token = authService.getToken();
    if (!token) {
        throw new Error('No authentication token available');
    }
    // Use centralized auth headers
    const baseHeaders = getAuthHeaders();
    // First attempt with current token
    let response = await fetch(input, {
        ...init,
        headers: {
            ...baseHeaders,
            ...init.headers
        }
    });
    // If we get a 401, the token might be expired
    if (response.status === 401) {
        console.log('🔄 Token expired, attempting to refresh...');
        try {
            // For now, just clear the auth state since we don't have a refresh method
            // In a real app, you'd call authService.refreshToken() here
            console.warn('No refresh method available, clearing auth state');
            authService.clearAuthState();
            throw new Error('Authentication failed - please log in again');
        }
        catch (refreshError) {
            console.error('❌ Auth refresh failed:', refreshError);
            throw new Error('Authentication failed - please log in again');
        }
    }
    return response;
}
// Helper to refresh access token
async function refreshAccessToken() {
    try {
        // For OTP-based auth, we might need to check if the current session is still valid
        // or implement a refresh token mechanism
        // For now, check if current token is still valid by calling a lightweight endpoint
        const currentToken = authService.getToken();
        if (!currentToken)
            return null;
        const testResponse = await fetch('/.netlify/functions/whoami', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (testResponse.ok) {
            // Token is still valid
            return currentToken;
        }
        else {
            // Token is invalid, clear it and redirect to auth
            authService.clearAuthState();
            return null;
        }
    }
    catch (error) {
        console.error('Token validation failed:', error);
        authService.clearAuthState();
        return null;
    }
}
// Export for backward compatibility with existing code
export { authFetch as authenticatedFetch };
