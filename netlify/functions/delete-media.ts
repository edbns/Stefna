// netlify/functions/delete-media.ts
// Deletes media assets using Prisma for consistent database access

import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { json } from './_lib/http';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { mediaId, userId } = body;

    if (!mediaId) {
      return json({ error: 'Missing mediaId' }, { status: 400 });
    }

    if (!userId) {
      return json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log('🗑️ [delete-media] Deleting media:', { mediaId, userId });

    // 🔧 FIX: Check if this is Neo Glitch media (CUID format) or regular media (UUID format)
    // Neo Glitch IDs start with 'c' and are longer (CUID format)
    // Regular media IDs are UUID format
    const isNeoGlitchMedia = mediaId.startsWith('c') && mediaId.length > 20;
    
    console.log('🔍 [delete-media] Media type detection:', { 
      mediaId, 
      isNeoGlitchMedia, 
      idLength: mediaId.length,
      startsWithC: mediaId.startsWith('c')
    });

    let deletedMedia;
    
    if (isNeoGlitchMedia) {
      // Delete from NeoGlitchMedia table
      console.log('🎭 [delete-media] Deleting from NeoGlitchMedia table');
      deletedMedia = await prisma.neoGlitchMedia.delete({
        where: {
          id: mediaId,
          userId: userId
        }
      });
    } else {
      // Delete from regular MediaAsset table
      console.log('📷 [delete-media] Deleting from MediaAsset table');
      deletedMedia = await prisma.mediaAsset.delete({
        where: {
          id: mediaId,
          userId: userId
        }
      });
    }

    if (deletedMedia) {
      console.log('✅ [delete-media] Media deleted successfully:', mediaId);
      return json({
        success: true,
        message: 'Media deleted successfully',
        deletedId: mediaId
      });
    } else {
      console.log('❌ [delete-media] Media not found or access denied:', mediaId);
      return json({ error: 'Media not found or access denied' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('💥 [delete-media] Delete error:', error);
    
    if (error.code === 'P2025') {
      return json({ error: 'Media not found' }, { status: 404 });
    }
    
    return json({ 
      error: 'DELETE_FAILED',
      message: error.message,
      status: 'failed'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
