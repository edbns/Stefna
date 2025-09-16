import type { Handler } from '@netlify/functions';
import { q } from './_db';
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

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Check for duplicate likes
    const duplicateLikes = await q(`
      SELECT 
        media_id, 
        media_type, 
        user_id, 
        COUNT(*) as like_count
      FROM likes 
      GROUP BY media_id, media_type, user_id 
      HAVING COUNT(*) > 1
      ORDER BY like_count DESC
    `);

    // Check total likes count for specific media
    const mediaLikesCount = await q(`
      SELECT 
        media_id, 
        media_type, 
        COUNT(*) as total_likes
      FROM likes 
      GROUP BY media_id, media_type
      ORDER BY total_likes DESC
      LIMIT 10
    `);

    // Check for specific Studio media that might have issues
    const studioLikes = await q(`
      SELECT 
        l.media_id, 
        l.media_type, 
        l.user_id,
        COUNT(*) as like_count,
        e.prompt
      FROM likes l
      LEFT JOIN edit_media e ON l.media_id = e.id
      WHERE l.media_type = 'edit'
      GROUP BY l.media_id, l.media_type, l.user_id, e.prompt
      ORDER BY like_count DESC
      LIMIT 20
    `);

    return json({
      success: true,
      duplicateLikes: duplicateLikes,
      mediaLikesCount: mediaLikesCount,
      studioLikes: studioLikes,
      summary: {
        duplicateCount: duplicateLikes.length,
        totalMediaWithLikes: mediaLikesCount.length
      }
    });

  } catch (error: any) {
    console.error('💥 [check-duplicate-likes] Error:', error?.message || error);
    return json({ 
      error: 'Failed to check duplicate likes',
      details: error?.message 
    }, { status: 500 });
  }
};
