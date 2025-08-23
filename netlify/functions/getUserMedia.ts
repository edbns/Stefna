// netlify/functions/getUserMedia.ts
// User media function - fetches user's media assets using Prisma
// Provides user-specific media data

import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // Handle CORS
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
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters
    const url = new URL(event.rawUrl);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'userId parameter is required' })
      };
    }

    console.log('🔍 [getUserMedia] Fetching media for user:', {
      userId,
      limit,
      offset
    });

    // Fetch user's media using Prisma
    const userMedia = await prisma.mediaAsset.findMany({
      where: {
        userId,
        status: 'ready'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    console.log('✅ [getUserMedia] Retrieved user media:', userMedia.length);

    // Transform to media format
    const mediaItems = userMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.finalUrl,
      mediaType: item.mediaType,
      prompt: item.prompt,
      presetKey: item.presetKey,
      status: item.status,
      isPublic: item.isPublic,
      allowRemix: item.allowRemix,
      createdAt: item.createdAt,
      type: 'media-asset'
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        items: mediaItems,
        total: mediaItems.length,
        hasMore: mediaItems.length === limit
      })
    };

  } catch (error: any) {
    console.error('💥 [getUserMedia] Media fetch error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'MEDIA_FETCH_FAILED',
        message: error.message,
        status: 'failed'
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
