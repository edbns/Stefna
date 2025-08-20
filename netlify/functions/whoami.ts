import type { Handler } from "@netlify/functions";
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    const { userId, email } = requireAuth(event.headers.authorization);
    
    return json({ 
      ok: true, 
      user: { 
        id: userId, 
        email,
        sub: userId // For compatibility
      } 
    });
  } catch (error: any) {
    console.error('❌ [whoami] Auth error:', error);
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
};

