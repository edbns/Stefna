// /.netlify/functions/whoami
// Quick sanity check for authentication propagation

import type { Handler } from '@netlify/functions';

function resp(status: number, body: any) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return resp(200, { ok: true });
  }

  if (event.httpMethod !== 'GET') {
    return resp(405, { error: 'Method not allowed' });
  }

  try {
    // Get user from Netlify context
    const user = context.clientContext?.user;
    
    if (!user) {
      return resp(401, { 
        error: 'No user context found',
        uid: null, 
        email: null, 
        raw: false,
        message: 'This usually means the JWT token is missing or invalid'
      });
    }

    // Extract user info
    const uid = user.sub;
    const email = user.email || user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

    console.log('🔐 whoami called:', { uid, email, hasUser: !!user });

    return resp(200, {
      ok: true,
      uid,
      email,
      raw: true,
      message: 'Authentication successful',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('whoami error:', error);
    return resp(500, { 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

