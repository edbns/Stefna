// /.netlify/functions/whoami
// Quick sanity check for authentication propagation

import type { Handler } from '@netlify/functions';
import { getAuthedUser } from '../lib/auth';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { user, error } = await getAuthedUser(event);
    
    return {
      statusCode: user ? 200 : 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: !!user, 
        user, 
        error,
        timestamp: new Date().toISOString(),
        env: {
          hasAuthJwtSecret: !!process.env.AUTH_JWT_SECRET,
          hasJwtSecret: !!process.env.JWT_SECRET,
          secretLength: (process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || '').length
        }
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        error: 'Server error', 
        message: e?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};

