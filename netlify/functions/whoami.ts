// Debug function to test JWT token and secret configuration
import type { Handler } from '@netlify/functions';
import { jwtVerify } from 'jose';

function getBearer(event: any) {
  const raw = event.headers?.authorization || event.headers?.Authorization || '';
  const m = String(raw).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : '';
}

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const token = getBearer(event);
    const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        hasToken: !!token,
        hasSecret: !!secret,
        secretLength: secret ? secret.length : 0,
        decoded: token && secret
          ? (await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] })).payload
          : null,
        env: {
          hasAuthJwtSecret: !!process.env.AUTH_JWT_SECRET,
          hasJwtSecret: !!process.env.JWT_SECRET,
          authJwtSecretLength: process.env.AUTH_JWT_SECRET?.length || 0,
          jwtSecretLength: process.env.JWT_SECRET?.length || 0
        }
      }),
    };
  } catch (e: any) {
    return { 
      statusCode: 401, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        error: e?.message || 'Unknown error',
        hasToken: !!getBearer(event),
        hasSecret: !!(process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET)
      }) 
    };
  }
};

