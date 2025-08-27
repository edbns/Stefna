// Story Time Create - Entry point for creating new photo stories
// Users upload photos, choose presets, and start AI story generation

import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
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

    const prisma = new PrismaClient();

    // Create the story
    const story = await prisma.story.create({
      data: {
        userId,
        title: title || `My ${preset === 'auto' ? 'Adventure' : preset} Story`,
        description,
        preset,
        status: 'pending',
        progress: 0
      }
    });

    // Create photo records
    const photoPromises = photos.map((photo: any, index: number) => 
      prisma.storyPhoto.create({
        data: {
          storyId: story.id,
          order: index + 1,
          imageUrl: photo.imageUrl || photo.url,
          prompt: null // Will be filled by AI later
        }
      })
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
      await prisma.story.update({
        where: { id: story.id },
        data: { preset: finalPreset }
      });
    }

    await prisma.$disconnect();

    console.log(`📖 [Story Time] Created story ${story.id} with ${storyPhotos.length} photos, preset: ${finalPreset}`);

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
