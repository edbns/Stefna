// netlify/functions/getUserMedia.ts
// User media function - fetches user's media assets using Prisma
// Provides user-specific media data

import type { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';



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

    // Fetch user's media using Prisma - from all new dedicated tables
    const [ghibliReactionMedia, emotionMaskMedia, presetsMedia, customPromptMedia, neoGlitchMedia] = await Promise.all([
      q(ghibliReactionMedia.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      q(emotionMaskMedia.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      q(presetsMedia.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      q(customPromptMedia.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      q(neoGlitchMedia.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })
    ]);

    console.log('✅ [getUserMedia] Retrieved user media:', {
      ghibliReaction: ghibliReactionMedia.length,
      emotionMask: emotionMaskMedia.length,
      presets: presetsMedia.length,
      customPrompt: customPromptMedia.length,
      neoGlitch: neoGlitchMedia.length
    });

    // Transform Ghibli Reaction media
    const ghibliItems = ghibliReactionMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.imageUrl,
      mediaType: 'image',
      prompt: item.prompt,
      presetKey: item.presetKey,
      status: 'ready',
      isPublic: false,
      allowRemix: false,
      createdAt: item.createdAt,
      type: 'ghibli-reaction',
      metadata: {
        presetKey: item.presetKey,
        presetType: 'ghibli-reaction',
        quality: 'high',
        generationTime: 0,
        modelVersion: '1.0'
      }
    }));

    // Transform Emotion Mask media
    const emotionMaskItems = emotionMaskMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.imageUrl,
      mediaType: 'image',
      prompt: item.prompt,
      presetKey: item.presetKey,
      status: 'ready',
      isPublic: false,
      allowRemix: false,
      createdAt: item.createdAt,
      type: 'emotion-mask',
      metadata: {
        presetKey: item.presetKey,
        presetType: 'emotion-mask',
        quality: 'high',
        generationTime: 0,
        modelVersion: '1.0'
      }
    }));

    // Transform Presets media
    const presetsItems = presetsMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.imageUrl,
      mediaType: 'image',
      prompt: item.prompt,
      presetKey: item.presetKey,
      status: 'ready',
      isPublic: false,
      allowRemix: false,
      createdAt: item.createdAt,
      type: 'presets',
      metadata: {
        presetKey: item.presetKey,
        presetType: 'presets',
        quality: 'high',
        generationTime: 0,
        modelVersion: '1.0'
      }
    }));

    // Transform Custom Prompt media
    const customPromptItems = customPromptMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.imageUrl,
      mediaType: 'image',
      prompt: item.prompt,
      presetKey: item.presetKey,
      status: 'ready',
      isPublic: false,
      allowRemix: false,
      createdAt: item.createdAt,
      type: 'custom-prompt',
      metadata: {
        presetKey: item.presetKey,
        presetType: 'custom-prompt',
        quality: 'high',
        generationTime: 0,
        modelVersion: '1.0'
      }
    }));

    // Transform NeoGlitch media
    const neoGlitchItems = neoGlitchMedia.map(item => ({
      id: item.id,
      userId: item.userId,
      finalUrl: item.imageUrl,
      mediaType: 'image',
      prompt: item.prompt,
      presetKey: item.presetKey,
      status: 'ready',
      isPublic: false, // NeoGlitch media is always private by default
      allowRemix: false, // NeoGlitch doesn't support remixing
      createdAt: item.createdAt,
      type: 'neo-glitch',
      // Include metadata for preset information
      metadata: {
        presetKey: item.presetKey,
        presetType: 'neo-glitch',  // ✅ Neo Glitch specific type
        quality: 'high',
        generationTime: 0,
        modelVersion: '1.0'
      }
    }));

    // Combine and sort by creation date
    const allMediaItems = [
      ...ghibliItems, 
      ...emotionMaskItems, 
      ...presetsItems, 
      ...customPromptItems, 
      ...neoGlitchItems
    ]
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
    
  }
};
