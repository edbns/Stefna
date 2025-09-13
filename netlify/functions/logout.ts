import type { Handler } from "@netlify/functions";
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Logout is handled client-side (clearing tokens from localStorage)
    // This endpoint just confirms the logout request was received
    console.log('🚪 [logout] Logout request received');
    
    return json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('❌ [logout] Error:', error);
    return json({ 
      error: 'Logout failed',
      message: 'An error occurred during logout'
    }, { status: 500 });
  }
};
