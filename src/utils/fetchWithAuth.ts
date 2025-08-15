// Centralized authenticated fetch utility
// Always includes JWT token from the existing auth system

import authService from '../services/authService';

export async function fetchWithAuth(url: string, init: RequestInit = {}) {
  const token = authService.getToken();
  if (!token) {
    throw new Error('Not signed in');
  }

  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
}

// Convenience methods for common operations
export const authFetch = {
  get: (url: string, init?: RequestInit) => 
    fetchWithAuth(url, { ...init, method: 'GET' }),
  
  post: (url: string, body: any, init?: RequestInit) => 
    fetchWithAuth(url, { 
      ...init, 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  put: (url: string, body: any, init?: RequestInit) => 
    fetchWithAuth(url, { 
      ...init, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
  
  delete: (url: string, init?: RequestInit) => 
    fetchWithAuth(url, { ...init, method: 'DELETE' }),
};
