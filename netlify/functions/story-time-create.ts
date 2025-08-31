// Story Time Create - Entry point for creating new photo stories
// Users upload photos, choose presets, and start AI story generation

import type { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';
import { v4 as uuidv4 } from 'uuid';

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
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authenticate user
    const { userId } = requireAuth(event.headers.authorization);
    
    const body = JSON.parse(event.body || '{}');
    const { 
      title, 
      description, 
      preset = 'auto', 
      photos 
    } = body;

    // Validate required fields
    if (!photos || !Array.isArray(photos) || photos.length < 2 || photos.length > 10) {
      return json({ 
        ok: false, 
        error: 'INVALID_PHOTOS',
        message: 'Please provide 2-10 photos for your story'
      }, { status: 400 });
    }

    // Validate preset
    const validPresets = ['auto', 'adventure', 'romance', 'mystery', 'comedy', 'fantasy', 'travel'];
    if (!validPresets.includes(preset)) {
      return json({ 
        ok: false, 
        error: 'INVALID_PRESET',
        message: 'Invalid story preset selected'
      }, { status: 400 });
    }

    

    // Create the story
    const story = await qOne(`
      INSERT INTO story (user_id, title, description, preset, status, fal_job_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, title, status, created_at
    `, [userId, title || `My ${preset === 'auto' ? 'Adventure' : preset} Story`, description, preset, 'pending', uuidv4()]);

    // Create photo records
    const photoPromises = photos.map((photo: any, index: number) => 
      q(`
        INSERT INTO story_photo (story_id, order_index, photo_url, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [story.id, index + 1, photo.imageUrl || photo.url])
    );

    const storyPhotos = await Promise.all(photoPromises);

    // If preset is 'auto', let AI choose the best theme
    let finalPreset = preset;
    if (preset === 'auto') {
      // Simple logic to auto-detect theme based on photo count and user preferences
      // In the future, you could use AI vision to analyze photo content
      const themes = ['adventure', 'romance', 'mystery', 'comedy', 'fantasy', 'travel'];
      finalPreset = themes[Math.floor(Math.random() * themes.length)];
      
      // Update story with detected preset
      await q(`
        UPDATE story SET preset = $1, updated_at = NOW() WHERE id = $2
      `, [finalPreset, story.id]);
    }

    

    console.log(`📖 [Story Time] Created story ${story.id} with ${storyPhotos.length} photos, preset: ${finalPreset}`);

    // 🎬 AUTOMATICALLY START VIDEO GENERATION
    try {
      console.log('🎬 [Story Time] Starting automatic video generation...');
      
      // Trigger video generation in background (don't wait for completion)
      fetch(`${process.env.URL}/.netlify/functions/story-time-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': event.headers.authorization || ''
        },
        body: JSON.stringify({
          storyId: story.id,
          userId: userId
        })
      }).catch(error => {
        console.error('❌ [Story Time] Failed to trigger video generation:', error);
        // Don't fail the story creation if video generation fails
      });

      console.log('🎬 [Story Time] Video generation triggered successfully');
    } catch (error) {
      console.error('❌ [Story Time] Error triggering video generation:', error);
      // Don't fail the story creation if video generation fails
    }

    return json({
      ok: true,
      story: {
        id: story.id,
        title: story.title,
        preset: finalPreset,
        status: story.status,
        progress: story.progress,
        photoCount: storyPhotos.length,
        createdAt: story.createdAt
      },
      message: `Story Time project created! Your ${finalPreset} story is ready to begin.`
    });

  } catch (error: any) {
    console.error('❌ [Story Time Create] Error:', error);
    
    return json({ 
      ok: false, 
      error: 'INTERNAL_ERROR',
      details: error.message || 'Failed to create story'
    }, { status: 500 });
  }
};
