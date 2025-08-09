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

  // Validate token
  if (!token || typeof token !== 'string') {
    console.error('❌ Auth token missing or invalid:', { 
      type: typeof token, 
      value: token 
    });
    throw new Error('Authentication required - please sign in again');
  }

  // Basic JWT format check
  if (!token.includes('.') || token.split('.').length !== 3) {
    console.error('❌ Invalid JWT format:', token.substring(0, 20) + '...');
    throw new Error('Invalid token format - please sign in again');
  }

  console.log('✅ Auth token ready:', token.substring(0, 12) + '...');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Get just the token string (for backward compatibility)
 * @param {Object} opts - Options object
 * @returns {string} Token string
 * @throws {Error} If no valid token is found
 */
export function getAuthToken(opts = {}) {
  const headers = getAuthHeaders(opts);
  return headers.Authorization.replace('Bearer ', '');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export function isAuthenticated() {
  try {
    getAuthToken();
    return true;
  } catch {
    return false;
  }
}

/**
 * Centralized fetch with automatic JWT headers
 * @param {string} url - The URL to fetch
 * @param {Object} opts - Fetch options
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If authentication fails
 */
export async function signedFetch(url, opts = {}) {
  const headers = getAuthHeaders(opts);
  
  return fetch(url, {
    ...opts,
    headers: {
      ...headers,
      ...(opts.headers || {})
    }
  });
}
