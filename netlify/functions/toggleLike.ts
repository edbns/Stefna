import type { Handler } from '@netlify/functions';
import { q } from './_db';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

interface ToggleLikeRequest {
  mediaId: string;
  mediaType: 'custom_prompt' | 'unreal_reflection' | 'ghibli_reaction' | 'neo_glitch' | 'presets' | 'story' | 'edit' | 'parallel_self';
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
    const body = JSON.parse(event.body || '{}');
    const { mediaId, mediaType } = body as ToggleLikeRequest;

    console.log('🔍 [toggleLike] Debug info:', {
      mediaId,
      mediaType,
      mediaIdType: typeof mediaId,
      userId,
      platform,
      bodyKeys: Object.keys(body)
    });

    if (!mediaId || !mediaType) {
      console.error('❌ [toggleLike] Missing required fields:', { mediaId, mediaType });
      return json({ error: 'Missing required fields: mediaId and mediaType' }, { status: 400 });
    }

    // Validate media type
    const validMediaTypes = ['custom_prompt', 'unreal_reflection', 'ghibli_reaction', 'neo_glitch', 'presets', 'story', 'edit', 'parallel_self'];
    if (!validMediaTypes.includes(mediaType)) {
      console.error('❌ [toggleLike] Invalid media type:', mediaType);
      return json({ error: `Invalid media type: ${mediaType}` }, { status: 400 });
    }

    // Check if the media exists
    let mediaTable: string;
    
    if (mediaType === 'edit') {
      mediaTable = 'edit_media';
    } else if (mediaType === 'story') {
      mediaTable = 'story';
    } else if (mediaType === 'parallel_self') {
      mediaTable = 'parallel_self_media';
    } else {
      mediaTable = `${mediaType}_media`;
    }
    
    console.log('🔍 [toggleLike] Checking media in table:', mediaTable);
    
    const mediaCheck = await q(`SELECT id, user_id FROM ${mediaTable} WHERE id = $1`, [mediaId]);
    
    if (mediaCheck.length === 0) {
      console.error('❌ [toggleLike] Media not found:', { mediaId, mediaTable });
      return json({ error: 'Media not found' }, { status: 404 });
    }

    console.log('✅ [toggleLike] Media found:', mediaCheck[0]);

    // Check if user already liked this media
    const existingLike = await q(
      'SELECT id FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
      [userId, mediaId, mediaType]
    );

    console.log('🔍 [toggleLike] Existing like check:', { 
      userId, 
      mediaId, 
      mediaType, 
      existingLikeCount: existingLike.length 
    });

    // Check for duplicates and clean them up if found
    if (existingLike.length > 1) {
      console.warn('⚠️ [toggleLike] Found duplicate likes, cleaning up...');
      // Keep only the first like, delete the rest
      const keepId = existingLike[0].id;
      await q(
        'DELETE FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3 AND id != $4',
        [userId, mediaId, mediaType, keepId]
      );
      console.log('✅ [toggleLike] Cleaned up duplicate likes');
    }

    let liked = false;
    let likesCount = 0;

    if (existingLike.length > 0) {
      // Unlike - remove the like
      console.log('🔄 [toggleLike] Removing like...');
      await q(
        'DELETE FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
        [userId, mediaId, mediaType]
      );
      liked = false;
    } else {
      // Like - add the like with conflict handling
      console.log('🔄 [toggleLike] Adding like...');
      try {
        await q(
          'INSERT INTO likes (user_id, media_id, media_type) VALUES ($1, $2, $3) ON CONFLICT (user_id, media_id, media_type) DO NOTHING',
          [userId, mediaId, mediaType]
        );
        liked = true;
      } catch (error) {
        // If insert failed due to conflict, check if like was actually added
        const checkLike = await q(
          'SELECT id FROM likes WHERE user_id = $1 AND media_id = $2 AND media_type = $3',
          [userId, mediaId, mediaType]
        );
        if (checkLike.length > 0) {
          liked = true;
          console.log('✅ [toggleLike] Like already exists (conflict resolved)');
        } else {
          throw error;
        }
      }
    }

    // Get updated likes count from the likes table
    const countResult = await q(
      'SELECT COUNT(*) as count FROM likes WHERE media_id = $1 AND media_type = $2',
      [mediaId, mediaType]
    );
    likesCount = Math.max(0, countResult[0]?.count || 0);

    console.log('✅ [toggleLike] Success:', { 
      liked, 
      likesCount, 
      mediaId, 
      mediaType 
    });

    return json({ 
      success: true,
      liked,
      likesCount,
      mediaId,
      mediaType
    });
  } catch (error: any) {
    console.error('💥 [toggleLike] Error:', error?.message || error);
    console.error('💥 [toggleLike] Stack:', error?.stack);
    return json({ 
      error: 'Failed to toggle like',
      details: error?.message 
    }, { status: 500 });
  }
};
