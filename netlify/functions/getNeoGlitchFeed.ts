// Neo Tokyo Glitch Feed Function
// Provides dedicated feed for Neo Tokyo Glitch content using Prisma
// Clean, type-safe database operations for long-term stability

import type { Handler } from '@netlify/functions';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters
    const url = new URL(event.rawUrl);
    const userId = url.searchParams.get('userId'); // Optional: filter by user
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query conditions
    const where: any = {
      status: 'completed'
    };

    if (userId) {
      where.userId = userId;
    }

    console.log('🎭 [GetNeoGlitchFeed] Fetching feed with conditions:', {
      userId: userId || 'all',
      limit,
      offset,
      where
    });

    // Fetch Neo Tokyo Glitch media using Prisma
    const neoGlitchFeed = await prisma.neoGlitchMedia.findMany({
      where,
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
    });

    console.log('✅ [GetNeoGlitchFeed] Retrieved feed items:', neoGlitchFeed.length);

    // Transform to feed format
    const feedItems = neoGlitchFeed.map(item => ({
      id: item.id,
      userId: item.userId,
      user: item.user,
      imageUrl: item.imageUrl,
      sourceUrl: item.sourceUrl,
      prompt: item.prompt,
      preset: item.preset,
      status: item.status,
      createdAt: item.createdAt,
      type: 'neo-glitch' // Identify as Neo Tokyo Glitch content
    }));

    return json({
      success: true,
      items: feedItems,
      total: feedItems.length,
      hasMore: feedItems.length === limit
    });

  } catch (error: any) {
    console.error('💥 [GetNeoGlitchFeed] Feed error:', error);
    
    return json({ 
      error: 'FEED_FETCH_FAILED',
      message: error.message,
      status: 'failed'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
