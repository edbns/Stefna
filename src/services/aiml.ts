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
  
  const response = await fetch('/.netlify/functions/aimlApi', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    throw new Error(`AIML API failed: ${response.status}`)
  }
  
  return response.json()
}
