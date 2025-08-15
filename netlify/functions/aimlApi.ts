import { json } from '@netlify/functions'
import { getIdentity } from '@netlify/edge-functions'

export default async (event) => {
  // Add server-side logging to confirm which path we're in
  console.log('aimlApi', {
    NO_DB: process.env.NO_DB_MODE,
    hasAuthHeader: Boolean(event.headers.authorization),
    hasAppKey: Boolean(event.headers['x-app-key'])
  });

  // Handle NO_DB_MODE - skip identity/DB checks entirely in local/demo
  if (process.env.NO_DB_MODE === '1') {
    console.log('NO_DB_MODE: skipping identity checks')
  } else {
    // Normal auth flow for production
    const token = event.headers.authorization?.split(' ')[1]
    if (!token) {
      console.error('No authorization header provided')
      return json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      const identity = await getIdentity({ token })
      if (!identity) {
        console.error('Invalid token provided')
        return json({ error: 'Invalid token' }, { status: 401 })
      }
      console.log('Identity verified:', identity.email)
    } catch (error) {
      console.error('Identity verification failed:', error)
      return json({ error: 'Identity verification failed' }, { status: 401 })
    }
  }

  // Check for required API key
  const API_KEY = process.env.AIML_API_KEY
  if (!API_KEY) {
    console.error('AIML_API_KEY missing from environment')
    return json({ error: 'AIML_API_KEY missing' }, { status: 500 })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    console.log('AIML API request:', { 
      hasImage: !!body.image_url, 
      hasPrompt: !!body.prompt,
      mode: body.mode || 'unknown'
    })
    
    // Your existing AIML API logic here
    // Make sure to use the API_KEY for the actual model calls
    
    // For now, return a mock response
    return json({
      success: true,
      outputs: [{
        url: 'https://example.com/mock-image.jpg'
      }]
    })
    
  } catch (error) {
    console.error('AIML API error:', error)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}


