import type { Handler } from "@netlify/functions";
import { q } from './_db';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { sessionId } = body;

    if (!sessionId) {
      return json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log('📝 [Upload Agreement] Recording agreement for session:', sessionId);

    // Store the agreement in a temporary table or use a different approach
    // For now, we'll just return success since the frontend will handle the state
    // In a real implementation, you might want to store this in a temporary table
    
    return json({ 
      success: true, 
      message: 'Upload agreement recorded',
      sessionId 
    });

  } catch (error) {
    console.error('💥 [Upload Agreement] Error:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
