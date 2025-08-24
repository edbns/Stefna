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

    // Fetch user's media using Prisma - both regular media assets and NeoGlitch media
    const [userMedia, neoGlitchMedia] = await Promise.all([
      prisma.mediaAsset.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.neoGlitchMedia.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      })
    ]);

    console.log('✅ [getUserMedia] Retrieved user media:', {
      regularMedia: userMedia.length,
      neoGlitchMedia: neoGlitchMedia.length
    });

    // Transform regular media assets
    const regularMediaItems = userMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.url,
      mediaType: item.resourceType,
      prompt: item.prompt,
      presetKey: item.prompt,
      status: 'ready',
      isPublic: item.visibility === 'public',
      allowRemix: item.allowRemix,
      createdAt: item.createdAt,
      type: 'media-asset'
    }));

    // Transform NeoGlitch media
    const neoGlitchItems = neoGlitchMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.imageUrl,
      mediaType: 'image',
      prompt: item.prompt,
      presetKey: item.preset,
      status: 'ready',
      isPublic: false, // NeoGlitch media is always private by default
      allowRemix: false, // NeoGlitch doesn't support remixing
      createdAt: item.createdAt,
      type: 'neo-glitch'
    }));

    // Combine and sort by creation date
    const allMediaItems = [...regularMediaItems, ...neoGlitchItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        items: allMediaItems,
        total: allMediaItems.length,
        hasMore: allMediaItems.length === limit
      })
    };

  } catch (error: any) {
    console.error('💥 [getUserMedia] Media fetch error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
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
