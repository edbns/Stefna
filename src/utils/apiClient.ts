import authService from '../services/authService'

function getToken() {
  return authService.getAuthState().token || localStorage.getItem('auth_token') || localStorage.getItem('token')
}

export async function signedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const baseHeaders: Record<string, string> = {}
  
  // Add Authorization header if token exists
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`
  }
  
  // Add x-app-key header for Netlify Functions (required by aimlApi)
  const functionAppKey = import.meta.env.VITE_FUNCTION_APP_KEY
  if (functionAppKey) {
    baseHeaders['x-app-key'] = functionAppKey
  }

  return fetch(url, { ...opts, headers: { ...baseHeaders, ...(opts.headers || {}) } })
}

export async function authenticatedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  return signedFetch(url, opts)
}
