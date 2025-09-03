import { Handler } from '@netlify/functions';
import { q } from '../utils/db';
import { getUser } from '../utils/auth';

interface ToggleLikeRequest {
  mediaId: string;
  mediaType: 'custom_prompt' | 'emotion_mask' | 'ghibli_reaction' | 'neo_glitch' | 'presets';
}

export const handler: Handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

    // Parse request body
    const { mediaId, mediaType } = JSON.parse(event.body || '{}') as ToggleLikeRequest;

    if (!mediaId || !mediaType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Validate media type
    const validMediaTypes = ['custom_prompt', 'emotion_mask', 'ghibli_reaction', 'neo_glitch', 'presets'];
    if (!validMediaTypes.includes(mediaType)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid media type' })
      };
    }

    // Check if the media exists
    const mediaTable = `${mediaType}_media`;
    const mediaCheck = await q(`SELECT id, user_id FROM ${mediaTable} WHERE id = $1`, [mediaId]);
    
    if (mediaCheck.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Media not found' })
      };
    }

    // Check if user already liked this media
    const existingLike = await q(
      'SELECT id FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
      [user.id, mediaId, mediaType]
    );

    let liked = false;
    let likesCount = 0;

    if (existingLike.length > 0) {
      // Unlike - remove the like
      await q(
        'DELETE FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
        [user.id, mediaId, mediaType]
      );
      liked = false;
    } else {
      // Like - add the like
      await q(
        'INSERT INTO likes (user_id, media_id, media_type) VALUES ($1, $2, $3)',
        [user.id, mediaId, mediaType]
      );
      liked = true;
    }

    // Get updated likes count
    const countResult = await q(
      `SELECT likes_count FROM ${mediaTable} WHERE id = $1`,
      [mediaId]
    );
    likesCount = countResult[0]?.likes_count || 0;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: true,
        liked,
        likesCount,
        mediaId,
        mediaType
      })
    };
  } catch (error: any) {
    console.error('💥 [toggleLike] Error:', error?.message || error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to toggle like',
        details: error?.message 
      })
    };
  }
};
