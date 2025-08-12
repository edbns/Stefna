import authService from '../services/authService'

function getToken() {
  return authService.getAuthState().token || localStorage.getItem('auth_token') || localStorage.getItem('token')
}

export async function signedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const baseHeaders: Record<string, string> = {}
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`
  }

  return fetch(url, { ...opts, headers: { ...baseHeaders, ...(opts.headers || {}) } })
}

export async function authenticatedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  return signedFetch(url, opts)
}
