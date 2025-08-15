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
 * Centralized fetch with automatic JWT headers
 * @param {string} url - The URL to fetch
 * @param {Object} opts - Fetch options
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If authentication fails
 */
export async function signedFetch(url, opts = {}) {
  const baseHeaders = getAuthHeaders(opts);
  return fetch(url, { ...opts, headers: { ...baseHeaders, ...(opts.headers || {}) } });
}
