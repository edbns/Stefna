import { requireAuth } from "./_auth";

export const handler = async (event: any) => {
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
    const claims = requireAuth(event.headers.authorization);
    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, claims }) 
    };
  } catch (err: any) {
    return { 
      statusCode: err.statusCode || 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.code || "INTERNAL" }) 
    };
  }
};
