// netlify/functions/getPublicFeed.ts
// Public feed function - fetches public media assets using Prisma
// Provides feed data for the main application

import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';

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
    const { limit = '20', offset = '0' } = event.queryStringParameters || {};
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    console.log('🔍 [getPublicFeed] Fetching public feed:', {
      limit: limitNum,
      offset: offsetNum
    });

    const prisma = new PrismaClient();

    try {
      // 🚨 CRITICAL FIX: Get ALL items from both tables, then combine and paginate properly
      const [publicMedia, neoGlitchMedia] = await Promise.all([
        prisma.mediaAsset.findMany({
          where: {
            visibility: 'public'
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
          }
          // ❌ REMOVED: take and skip - we'll get ALL items first
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
          }
          // ❌ REMOVED: take and skip - we'll get ALL items first
        })
      ]);

      console.log('✅ [getPublicFeed] Retrieved public media:', publicMedia.length);
      console.log('✅ [getPublicFeed] Retrieved Neo Tokyo Glitch media:', neoGlitchMedia.length);

      // Transform main media assets to feed format
      const mainFeedItems = publicMedia.map(item => ({
        id: item.id,
        userId: item.userId,
        user: item.user, // Now using 'user' instead of 'owner'
        finalUrl: item.url,
        mediaType: item.resourceType,
        prompt: item.prompt,
        presetKey: item.presetKey, // Using the actual presetKey field
        status: item.status || 'ready',
        createdAt: item.createdAt,
        type: 'media-asset'
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

      // ✅ FIXED: Combine ALL items first, then sort, then apply pagination
      const allFeedItems = [...mainFeedItems, ...glitchFeedItems].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // ✅ FIXED: Apply pagination to the combined, sorted results
      const feedItems = allFeedItems.slice(offsetNum, offsetNum + limitNum);

      await prisma.$disconnect();

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
          hasMore: feedItems.length === limitNum
        })
      };

    } catch (dbError) {
      console.error('💥 [getPublicFeed] Database error:', dbError);
      await prisma.$disconnect();
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'FEED_FETCH_FAILED',
          message: dbError instanceof Error ? dbError.message : String(dbError),
          status: 'failed'
        })
      };
    }

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
  }
};
