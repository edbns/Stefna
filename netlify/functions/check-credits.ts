import type { Handler } from '@netlify/functions';
import { qOne } from './_db';
import { requireAuth } from './_lib/auth';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' });
    };
  }

  try {
    // Get userId from Authorization header instead of query parameters
    const { userId } = requireAuth(event.headers.authorization);
    
    // Get user credits using pg
    const userCredits = await qOne<{ credits: number; balance: number }>(
      'SELECT credits, balance FROM user_credits WHERE user_id = $1',
      [userId]
    );

    if (!userCredits) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'User credits not found' });
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        credits: userCredits.credits,
        balance: userCredits.balance
      });
    };

  } catch (error: any) {
    console.error('Error checking credits:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      });
    };
  }
};
