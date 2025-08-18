// Centralized authenticated fetch utility
// Always includes JWT token from the existing auth system
// Forces auth on every Netlify function call
import authService from '../services/authService';
export async function fetchWithAuth(url, init = {}) {
    const token = authService.getToken();
    console.log('🔐 fetchWithAuth called:', {
        url,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        tokenParts: token ? token.split('.').length : 0,
        method: init.method || 'GET'
    });
    if (!token) {
        throw new Error('Not signed in - no JWT token available');
    }
    // Ensure we're calling a Netlify function
    if (!url.includes('/.netlify/functions/')) {
        console.warn('fetchWithAuth called with non-Netlify function URL:', url);
    }
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    // Set Content-Type for JSON requests
    if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    console.log(`🔐 fetchWithAuth headers:`, Object.fromEntries(headers.entries()));
    const response = await fetch(url, {
        ...init,
        headers
    });
    console.log(`🔐 fetchWithAuth response:`, {
        url,
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
    });
    return response;
}
// Convenience methods for common operations
export const authFetch = {
    get: (url, init) => fetchWithAuth(url, { ...init, method: 'GET' }),
    post: (url, body, init) => fetchWithAuth(url, {
        ...init,
        method: 'POST',
        body: JSON.stringify(body)
    }),
    put: (url, body, init) => fetchWithAuth(url, {
        ...init,
        method: 'PUT',
        body: JSON.stringify(body)
    }),
    delete: (url, init) => fetchWithAuth(url, { ...init, method: 'DELETE' }),
};
// Quick auth check utility
export function isAuthenticated() {
    return authService.isAuthenticated();
}
// Get current user ID for debugging
export function getCurrentUserId() {
    const user = authService.getCurrentUser();
    return user?.id || null;
}
