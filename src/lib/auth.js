// Auth utility for consistent token handling across all API calls

import authService from '../services/authService'

/**
 * Get auth headers for API requests
 * @param {Object} opts - Options object
 * @param {string} opts.token - Optional explicit token to use
 * @returns {Object} Headers object with Authorization
 * @throws {Error} If no valid token is found
 */
export function getAuthHeaders(opts = {}) {
  // Try to get token from multiple sources
  let token = opts.token || 
              localStorage.getItem('auth_token') || 
              authService.getToken() || 
              '';

  // Ensure token is a string, not an object
  if (typeof token === 'object') {
    console.error('⚠️ Token is object, extracting string:', token);
    token = token.access_token || token.token || token.jwt || '';
  }

  // Base headers
  const headers = { 'Content-Type': 'application/json' };

  // Add x-app-key header for Netlify Functions (required by aimlApi)
  const functionAppKey = import.meta.env.VITE_FUNCTION_APP_KEY;
  if (functionAppKey) {
    headers['x-app-key'] = functionAppKey;
  }

  // If no token, fall back to guest mode (omit Authorization)
  if (!token || typeof token !== 'string' || !token.includes('.') || token.split('.').length !== 3) {
    return headers;
  }

  // Valid token - add Authorization header
  headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Get just the token string (for backward compatibility)
 * @param {Object} opts - Options object
 * @returns {string} Token string
 * @throws {Error} If no valid token is found
 */
export function getAuthToken(opts = {}) {
  const headers = getAuthHeaders(opts);
  const auth = headers.Authorization || '';
  return auth.startsWith('Bearer ') ? auth.replace('Bearer ', '') : '';
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export function isAuthenticated() {
  try {
    const token = getAuthToken();
    return Boolean(token);
  } catch {
    return false;
  }
}

/**
 * Centralized fetch with automatic JWT headers and token refresh on 401
 * @param {string} url - The URL to fetch
 * @param {Object} opts - Fetch options
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If authentication fails
 */
export async function signedFetch(url, opts = {}) {
  // Proactive check: if token is expired, try to refresh BEFORE making the request
  if (authService.getToken() && authService.isTokenExpired()) {
    console.log('🔄 [signedFetch] Token expired before request, attempting proactive refresh...');
    
    try {
      const refreshed = await authService.refreshAccessToken();
      
      if (!refreshed) {
        console.error('❌ [signedFetch] Proactive refresh failed, logging out...');
        authService.logout();
        window.location.href = '/auth';
        throw new Error('Session expired. Please log in again.');
      }
      
      console.log('✅ [signedFetch] Token proactively refreshed');
    } catch (error) {
      console.error('❌ [signedFetch] Proactive refresh error:', error);
      authService.logout();
      window.location.href = '/auth';
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  const baseHeaders = getAuthHeaders(opts);
  
  // First attempt with current token
  let response = await fetch(url, { ...opts, headers: { ...baseHeaders, ...(opts.headers || {}) } });
  
  // If we get a 401, the token might be expired - try to refresh
  if (response.status === 401) {
    console.log('🔄 [signedFetch] Got 401, attempting token refresh...');
    
    try {
      // Try to refresh the token using authService
      const refreshed = await authService.refreshAccessToken();
      
      if (refreshed) {
        console.log('✅ [signedFetch] Token refreshed, retrying request...');
        
        // Get new headers with refreshed token
        const newHeaders = getAuthHeaders(opts);
        
        // Retry the request with new token
        response = await fetch(url, { ...opts, headers: { ...newHeaders, ...(opts.headers || {}) } });
        
        // If still 401 after refresh, logout
        if (response.status === 401) {
          console.error('❌ [signedFetch] Still 401 after refresh, logging out...');
          authService.logout();
          window.location.href = '/auth';
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        // Refresh failed, logout
        console.error('❌ [signedFetch] Token refresh failed, logging out...');
        authService.logout();
        window.location.href = '/auth';
        throw new Error('Session expired. Please log in again.');
      }
    } catch (error) {
      console.error('❌ [signedFetch] Token refresh error:', error);
      authService.logout();
      window.location.href = '/auth';
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  return response;
}
