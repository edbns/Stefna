import type { Handler } from '@netlify/functions';
import { q } from './_db';
import { requireAuth } from './_auth';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
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

  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    });
  }

  try {
    // Authenticate user
    const { userId } = requireAuth(event.headers?.authorization || event.headers?.Authorization || '');

    // Get all likes by this user
    const userLikes = await q(
      'SELECT media_id, media_type FROM likes WHERE user_id = $1',
      [userId]
    );

    // Format likes into a map for easy lookup
    const likesMap: Record<string, boolean> = {};
    userLikes.forEach((like: any) => {
      likesMap[`${like.media_type}:${like.media_id}`] = true;
    });

    return json({ 
      likes: likesMap,
      count: userLikes.length
    });
  } catch (error: any) {
    console.error('💥 [getUserLikes] Error:', error?.message || error);
    return json({ 
      error: 'Failed to get user likes',
      details: error?.message 
    }, { status: 500 });
  }
};
