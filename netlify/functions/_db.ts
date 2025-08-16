import { neon, neonConfig } from '@neondatabase/serverless';
import { jwtVerify } from 'jose';

// Reuse connections across invocations for better performance
neonConfig.fetchConnectionCache = true;

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '';

if (!url) {
  throw new Error('Missing DATABASE_URL or NETLIFY_DATABASE_URL environment variable');
}

export const sql = neon(url);

// Helper for consistent error responses
export const json = (body: any, statusCode: number = 200) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-idempotency-key, X-Idempotency-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  },
  body: JSON.stringify(body)
});

// Helper for parsing JWT and getting user ID
export const parseUserIdFromJWT = async (authHeader: string): Promise<string> => {
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header format');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Get JWT secret from environment
    const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    
    // Extract user ID from payload
    const userId = payload.sub || payload.user_id || payload.id;
    if (!userId) {
      throw new Error('JWT payload missing user ID');
    }

    return userId as string;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid JWT token');
  }
};
