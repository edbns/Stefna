// src/utils/fetchAuthed.ts
// Centralized auth headers for any protected function

import authService from '../services/authService'

export async function fetchAuthed(input: RequestInfo, init: RequestInit = {}) {
  const token = authService.getToken()
  
  if (!token) {
    throw new Error('Authentication required')
  }
  
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
}

// Convenience wrapper for JSON POST requests
export async function postAuthed(url: string, data: any, options: RequestInit = {}) {
  return fetchAuthed(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  })
}
