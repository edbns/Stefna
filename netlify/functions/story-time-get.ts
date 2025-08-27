// Story Time Get - Retrieve user's photo stories
// Shows all stories with their status, progress, and photo details

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
    
    const prisma = new PrismaClient();

    // Get user's stories with photos
    const stories = await prisma.story.findMany({
      where: { userId },
      include: {
        photos: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            imageUrl: true,
            prompt: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    await prisma.$disconnect();

    // Format stories for response
    const formattedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      description: story.description,
      preset: story.preset,
      status: story.status,
      progress: story.progress,
      storyText: story.storyText,
      photoCount: story.photos.length,
      photos: story.photos,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    }));

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
