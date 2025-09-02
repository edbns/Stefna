// netlify/functions/delete-media.ts
// Deletes media assets using raw SQL for consistent database access

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
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Content-Type': 'application/json'
      },
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
      const result = await q(`
        DELETE FROM neo_glitch_media 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [mediaId, userId]);
      if (result && result.length > 0) {
        deletedMedia = result;
        deletedFromTable = 'neoGlitchMedia';
      }
    } catch (error: any) {
      if (error.code !== 'P2025') { // Not "Record not found"
        console.log('⚠️ [delete-media] Neo Glitch delete failed:', error.message);
      }
    }

    // Try Custom Prompt Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM custom_prompt_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'customPromptMedia';
        }
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Custom Prompt delete failed:', error.message);
        }
      }
    }

    // Try Emotion Mask Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM emotion_mask_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'emotionMaskMedia';
        }
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Emotion Mask delete failed:', error.message);
        }
      }
    }

    // Try Ghibli Reaction Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM ghibli_reaction_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'ghibliReactionMedia';
        }
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Ghibli Reaction delete failed:', error.message);
        }
      }
    }

    // Try Presets Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM presets_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'presetsMedia';
        }
      } catch (error: any) {
        if (error.code !== 'P2025') {
          console.log('⚠️ [delete-media] Presets delete failed:', error.message);
        }
      }
    }

    // Try Story Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM story 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'story';
        }
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

  } catch (error) {
    console.error('💥 [delete-media] Error:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
