// netlify/functions/delete-media.ts
// Deletes media assets using Prisma for consistent database access

import type { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';



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

    // Try to delete from all media tables
    let deletedMedia = null;
    let deletedFromTable = '';

    // Try Neo Glitch Media first (CUID format)
    try {
      deletedMedia = await q(neoGlitchMedia.delete({
        where: {
          id: mediaId,
          userId: userId
        }
      });
      deletedFromTable = 'neoGlitchMedia';
    } catch (error: any) {
      if (error.code !== 'P2025') { // Not "Record not found"
        console.log('⚠️ [delete-media] Neo Glitch delete failed:', error.message);
      }
    }

    // Try Custom Prompt Media
    if (!deletedMedia) {
      try {
        deletedMedia = await q(customPromptMedia.delete({
          where: {
            id: mediaId,
            userId: userId
          }
        });
        deletedFromTable = 'customPromptMedia';
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Custom Prompt delete failed:', error.message);
        }
      }
    }

    // Try Emotion Mask Media
    if (!deletedMedia) {
      try {
        deletedMedia = await q(emotionMaskMedia.delete({
          where: {
            id: mediaId,
            userId: userId
          }
        });
        deletedFromTable = 'emotionMaskMedia';
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Emotion Mask delete failed:', error.message);
        }
      }
    }

    // Try Ghibli Reaction Media
    if (!deletedMedia) {
      try {
        deletedMedia = await q(ghibliReactionMedia.delete({
          where: {
            id: mediaId,
            userId: userId
          }
        });
        deletedFromTable = 'ghibliReactionMedia';
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Ghibli Reaction delete failed:', error.message);
        }
      }
    }

    // Try Presets Media
    if (!deletedMedia) {
      try {
        deletedMedia = await q(presetsMedia.delete({
          where: {
            id: mediaId,
            userId: userId
          }
        });
        deletedFromTable = 'presetsMedia';
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Presets delete failed:', error.message);
        }
      }
    }

    // Try Story Media
    if (!deletedMedia) {
      try {
        deletedMedia = await q(story.delete({
          where: {
            id: mediaId,
            userId: userId
          }
        });
        deletedFromTable = 'story';
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Story delete failed:', error.message);
        }
      }
    }

    if (deletedMedia) {
      console.log('✅ [delete-media] Media deleted successfully from', deletedFromTable, ':', mediaId);
      return json({
        success: true,
        message: 'Media deleted successfully',
        deletedId: mediaId,
        deletedFromTable: deletedFromTable
      });
    } else {
      console.log('❌ [delete-media] Media not found in any table:', mediaId);
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
    
  }
};
