// /.netlify/functions/whoami
// Quick sanity check for authentication propagation

import { requireUser, resp, handleCORS } from './_auth';

export const handler = async (event: any, context: any) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const u = context.clientContext?.user || null;
    
    return resp(200, { 
      uid: u?.sub ?? null, 
      email: u?.email ?? null, 
      raw: !!u,
      timestamp: new Date().toISOString(),
      message: u ? 'User authenticated' : 'No user found'
    });
  } catch (error) {
    console.error('whoami error:', error);
    return resp(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

