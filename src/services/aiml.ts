// src/services/aiml.ts
export async function callAimlApi(payload: any) {
  const response = await fetch('/.netlify/functions/aimlApi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': import.meta.env.VITE_FUNCTION_APP_KEY, // must be defined at build time
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    console.error('AIML API failed:', response.status, response.statusText)
    throw new Error(`AIML API failed: ${response.status}`)
  }
  
  return response.json()
}
