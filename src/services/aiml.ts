// src/services/aiml.ts
export async function callAimlApi(payload: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  
  // Only send Authorization header if not in NO_DB_MODE
  if (import.meta.env.VITE_NO_DB_MODE !== '1') {
    // Try to get token from auth service
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  // Add logging to debug auth issues
  console.log('callAimlApi', {
    NO_DB_MODE: import.meta.env.VITE_NO_DB_MODE,
    hasAuthHeader: Boolean(headers['Authorization']),
    payload: { hasImage: !!payload.image_url, hasPrompt: !!payload.prompt }
  })
  
  const response = await fetch('/.netlify/functions/aimlApi', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    console.error('AIML API failed:', response.status, response.statusText)
    throw new Error(`AIML API failed: ${response.status}`)
  }
  
  return response.json()
}
