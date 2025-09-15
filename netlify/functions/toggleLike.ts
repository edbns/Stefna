import type { Handler } from '@netlify/functions';
import { q } from './_db';
import { requireAuth } from './_auth';
import { json } from './_lib/http';

interface ToggleLikeRequest {
  mediaId: string;
  mediaType: 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'neo_glitch' | 'presets' | 'story' | 'edit';
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
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

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  try {
    // Authenticate user
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const { userId, platform } = requireAuth(authHeader);

    // Parse request body
    const { mediaId, mediaType } = JSON.parse(event.body || '{}') as ToggleLikeRequest;

    if (!mediaId || !mediaType) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate media type and disallow likes from non-web if needed in future
    const validMediaTypes = ['custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'neo_glitch', 'presets', 'story', 'edit'];
    if (!validMediaTypes.includes(mediaType)) {
      return json({ error: 'Invalid media type' }, { status: 400 });
    }

    // Check if the media exists
    const mediaTable = mediaType === 'story' || mediaType === 'edit' ? 'edit_media' : `${mediaType}_media`;
    const mediaCheck = await q(`SELECT id, user_id FROM ${mediaTable} WHERE id = $1`, [mediaId]);
    
    if (mediaCheck.length === 0) {
      return json({ error: 'Media not found' }, { status: 404 });
    }

    // Check if user already liked this media
    const existingLike = await q(
      'SELECT id FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
      [userId, mediaId, mediaType]
    );

    let liked = false;
    let likesCount = 0;

    if (existingLike.length > 0) {
      // Unlike - remove the like
      await q(
        'DELETE FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
        [userId, mediaId, mediaType]
      );
      liked = false;
    } else {
      // Like - add the like
      await q(
        'INSERT INTO likes (user_id, media_id, media_type) VALUES ($1, $2, $3)',
        [userId, mediaId, mediaType]
      );
      liked = true;
    }

    // Get updated likes count from the likes table
    const countResult = await q(
      'SELECT COUNT(*) as count FROM likes WHERE media_id = $1 AND media_type = $2',
      [mediaId, mediaType]
    );
    likesCount = Math.max(0, countResult[0]?.count || 0); // Ensure minimum is 0

    return json({ 
      success: true,
      liked,
      likesCount,
      mediaId,
      mediaType
    });
  } catch (error: any) {
    console.error('💥 [toggleLike] Error:', error?.message || error);
    return json({ 
      error: 'Failed to toggle like',
      details: error?.message 
    }, { status: 500 });
  }
};
