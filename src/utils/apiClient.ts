import authService from '../services/authService'

function getToken() {
  return authService.getAuthState().token || localStorage.getItem('auth_token') || localStorage.getItem('token')
}

export async function signedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken()
  if (!token) {
    throw new Error('Not logged in')
  }
  
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'Authorization': `Bearer ${token}`
    }
  })
}

export async function authenticatedFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  return signedFetch(url, opts)
}
