import type { Handler } from "@netlify/functions";
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    // Get admin secret from request body
    let adminSecret
    try {
      const body = JSON.parse(event.body || '{}')
      adminSecret = body.adminSecret
    } catch (e) {
      // Fallback to headers if body parsing fails
      adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    }
    
    if (!adminSecret) {
      return json({ error: 'Admin secret required' }, { status: 401 })
    }

    // Check against environment variable
    const expectedSecret = process.env.ADMIN_SECRET
    
    if (!expectedSecret) {
      console.error('❌ ADMIN_SECRET environment variable not set')
      return json({ error: 'Admin system not configured' }, { status: 500 })
    }

    if (adminSecret !== expectedSecret) {
      console.warn('⚠️ Invalid admin secret attempt:', adminSecret)
      return json({ error: 'Invalid admin secret' }, { status: 401 })
    }

    console.log('✅ Admin verification successful')
    
    return json({
      authenticated: true,
      message: 'Admin access granted',
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('❌ Admin verification error:', e)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}
