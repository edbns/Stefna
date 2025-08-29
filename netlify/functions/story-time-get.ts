// Story Time Get - Retrieve user's photo stories
// Shows all stories with their status, progress, and photo details

import type { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { requireAuth } from './_lib/auth';
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
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authenticate user
    const { userId } = requireAuth(event.headers.authorization);
    
    

    // Get user's stories with photos
    const stories = await q(`
      SELECT s.id, s.title, s.description, s.preset, s.status, s.created_at, s.updated_at
      FROM story s
      WHERE s.user_id = $1 
      ORDER BY s.created_at DESC
    `, [userId]);

    // Get photos for each story
    const storyPhotos = await q(`
      SELECT sp.story_id, sp.id, sp.order_index, sp.photo_url, sp.created_at
      FROM story_photo sp
      JOIN story s ON sp.story_id = s.id
      WHERE s.user_id = $1
      ORDER BY sp.story_id, sp.order_index
    `, [userId]);

    

    // Format stories for response
    const formattedStories = stories.map(story => {
      const photos = storyPhotos.filter(photo => photo.story_id === story.id);
      return {
        id: story.id,
        title: story.title,
        description: story.description,
        preset: story.preset,
        status: story.status,
        photoCount: photos.length,
        photos: photos.map(photo => ({
          id: photo.id,
          order: photo.order_index,
          imageUrl: photo.photo_url,
          createdAt: photo.created_at
        })),
        createdAt: story.created_at,
        updatedAt: story.updated_at
      };
    });

    return json({
      ok: true,
      stories: formattedStories,
      count: formattedStories.length,
      message: `Found ${formattedStories.length} stories`
    });

  } catch (error: any) {
    console.error('❌ [Story Time Get] Error:', error);
    
    return json({ 
      ok: false, 
      error: 'INTERNAL_ERROR',
      details: error.message || 'Failed to retrieve stories'
    }, { status: 500 });
  }
};
