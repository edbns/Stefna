// netlify/functions/getPublicFeed.ts
// Public feed function - fetches public media assets using Prisma
// Provides feed data for the main application

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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userId = url.searchParams.get('userId'); // Optional: filter by user

    console.log('🔍 [getPublicFeed] Fetching public feed:', {
      limit,
      offset,
      userId: userId || 'all'
    });

    // Build query conditions
    const where: any = {
      isPublic: true,
      status: 'ready'
    };

    if (userId) {
      where.userId = userId;
    }

    // Fetch both types of public media using Prisma
    const [publicMedia, neoGlitchMedia] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.neoGlitchMedia.findMany({
        where: {
          status: 'completed'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      })
    ]);

    console.log('✅ [getPublicFeed] Retrieved public media:', publicMedia.length);
    console.log('✅ [getPublicFeed] Retrieved Neo Tokyo Glitch media:', neoGlitchMedia.length);

    // Transform main media assets to feed format
    const mainFeedItems = publicMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      user: item.owner,
      finalUrl: item.finalUrl,
      mediaType: item.mediaType,
      prompt: item.prompt,
      presetKey: item.presetKey,
      status: item.status,
      createdAt: item.createdAt,
      type: 'media-asset' // Identify as main media asset
    }));

    // Transform Neo Tokyo Glitch media to feed format
    const glitchFeedItems = neoGlitchMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      user: item.user,
      finalUrl: item.imageUrl, // Neo Tokyo Glitch uses imageUrl
      mediaType: 'image',
      prompt: item.prompt,
      presetKey: item.preset,
      status: item.status,
      createdAt: item.createdAt,
      type: 'neo-glitch' // Identify as Neo Tokyo Glitch
    }));

    // Combine and sort by creation date
    const allFeedItems = [...mainFeedItems, ...glitchFeedItems].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply limit and offset to combined results
    const feedItems = allFeedItems.slice(offset, offset + limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        items: feedItems,
        total: feedItems.length,
        hasMore: feedItems.length === limit
      })
    };

  } catch (error: any) {
    console.error('💥 [getPublicFeed] Feed error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'FEED_FETCH_FAILED',
        message: error.message,
        status: 'failed'
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
