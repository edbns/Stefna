import { Handler } from '@netlify/functions';
import { q } from '../utils/db';
import { getUser } from '../utils/auth';

export const handler: Handler = async (event) => {
  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle OPTIONS request for CORS
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
    // Authenticate user
    const user = await getUser(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Get all likes by this user
    const userLikes = await q(
      'SELECT media_id, media_type FROM likes WHERE user_id = $1',
      [user.id]
    );

    // Format likes into a map for easy lookup
    const likesMap: Record<string, boolean> = {};
    userLikes.forEach(like => {
      likesMap[`${like.media_type}:${like.media_id}`] = true;
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ 
        likes: likesMap,
        count: userLikes.length
      })
    };
  } catch (error: any) {
    console.error('💥 [getUserLikes] Error:', error?.message || error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to get user likes',
        details: error?.message 
      })
    };
  }
};
