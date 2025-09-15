// netlify/functions/delete-media.ts
// Deletes media assets using raw SQL for consistent database access
// Updated for mobile/web platform separation - userId extracted from JWT

import type { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';
import { requireAuth } from './_lib/auth';

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
    // Extract userId from JWT token (platform-aware authentication)
    const auth = requireAuth(event.headers?.authorization || event.headers?.Authorization);
    const userId = auth.userId;
    
    const body = JSON.parse(event.body || '{}');
    const { mediaId } = body;

    if (!mediaId) {
      return json({ error: 'Missing mediaId' }, { status: 400 });
    }

    console.log('🗑️ [delete-media] Authenticated deletion:', { 
      mediaId, 
      userId,
      platform: auth.platform 
    });

    // First, verify the media exists and belongs to the user
    let mediaExists = false;
    let mediaTable = '';
    
    // Check all tables to see where the media exists
    // Note: edit_media uses run_id (TEXT) instead of id (INTEGER) for lookups
    const tables = [
      { name: 'neo_glitch_media', display: 'neoGlitchMedia', idField: 'id' },
      { name: 'custom_prompt_media', display: 'customPromptMedia', idField: 'id' },
      { name: 'unreal_reflection_media', display: 'unrealReflectionMedia', idField: 'id' },
      { name: 'ghibli_reaction_media', display: 'ghibliReactionMedia', idField: 'id' },
      { name: 'presets_media', display: 'presetsMedia', idField: 'id' },
      { name: 'story', display: 'story', idField: 'id' },
      { name: 'edit_media', display: 'editMedia', idField: 'id' }, // edit_media now uses id (TEXT) like other tables
      { name: 'parallel_self_media', display: 'parallelSelfMedia', idField: 'id' }
    ];
    
    for (const table of tables) {
      try {
        const checkResult = await q(`
          SELECT ${table.idField} FROM ${table.name} 
          WHERE ${table.idField} = $1 AND user_id = $2
        `, [mediaId, userId]);
        
        if (checkResult && checkResult.length > 0) {
          mediaExists = true;
          mediaTable = table.display;
          console.log('🔍 [delete-media] Found media in table:', table.display);
          break;
        }
      } catch (error: any) {
        console.error('❌ [delete-media] Check failed for table:', table.name, error.message);
      }
    }
    
    if (!mediaExists) {
      console.log('❌ [delete-media] Media not found in any table or access denied:', mediaId);
      return json({ error: 'Media not found or access denied' }, { status: 404 });
    }

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
      console.log('🔍 [delete-media] Neo Glitch result:', { result, length: result?.length });
      if (result && result.length > 0) {
        deletedMedia = result;
        deletedFromTable = 'neoGlitchMedia';
      }
    } catch (error: any) {
      console.error('❌ [delete-media] Neo Glitch delete error:', { 
        error: error.message, 
        code: error.code, 
        detail: error.detail,
        constraint: error.constraint 
      });
    }

    // Try Custom Prompt Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM custom_prompt_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        console.log('🔍 [delete-media] Custom Prompt result:', { result, length: result?.length });
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'customPromptMedia';
        }
      } catch (error: any) {
        console.error('❌ [delete-media] Custom Prompt delete error:', { 
          error: error.message, 
          code: error.code, 
          detail: error.detail,
          constraint: error.constraint 
        });
      }
    }

    // Try Emotion Mask Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM unreal_reflection_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        console.log('🔍 [delete-media] Unreal Reflection result:', { result, length: result?.length });
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'unrealReflectionMedia';
        }
      } catch (error: any) {
        console.error('❌ [delete-media] Unreal Reflection delete error:', { 
          error: error.message, 
          code: error.code, 
          detail: error.detail,
          constraint: error.constraint 
        });
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

    // Try Edit Media (now uses id like other tables)
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM edit_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        console.log('🔍 [delete-media] Edit Media result:', { result, length: result?.length });
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'editMedia';
        }
      } catch (error: any) {
        console.error('❌ [delete-media] Edit Media delete error:', { 
          error: error.message, 
          code: error.code, 
          detail: error.detail,
          constraint: error.constraint 
        });
      }
    }

    // Try Parallel Self Media
    if (!deletedMedia) {
      try {
        const result = await q(`
          DELETE FROM parallel_self_media 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `, [mediaId, userId]);
        console.log('🔍 [delete-media] Parallel Self Media result:', { result, length: result?.length });
        if (result && result.length > 0) {
          deletedMedia = result;
          deletedFromTable = 'parallelSelfMedia';
        }
      } catch (error: any) {
        console.error('❌ [delete-media] Parallel Self Media delete error:', { 
          error: error.message, 
          code: error.code, 
          detail: error.detail,
          constraint: error.constraint 
        });
      }
    }

    if (deletedMedia) {
      console.log('✅ [delete-media] Media deleted successfully from', deletedFromTable, ':', mediaId);
      
      // Clean up related data
      try {
        // 1. Delete all likes for this media
        const likesDeleted = await q(`
          DELETE FROM likes 
          WHERE media_id::text = $1::text
        `, [mediaId]);
        console.log('🗑️ [delete-media] Deleted likes:', likesDeleted?.length || 0);
        
        // 2. Get media info for Cloudinary cleanup
        const mediaInfo = await q(`
          SELECT image_url 
          FROM ${mediaTable === 'neoGlitchMedia' ? 'neo_glitch_media' :
                mediaTable === 'customPromptMedia' ? 'custom_prompt_media' :
                mediaTable === 'unrealReflectionMedia' ? 'unreal_reflection_media' :
                mediaTable === 'ghibliReactionMedia' ? 'ghibli_reaction_media' :
                mediaTable === 'presetsMedia' ? 'presets_media' :
                mediaTable === 'story' ? 'story' :
                mediaTable === 'editMedia' ? 'edit_media' :
                mediaTable === 'parallelSelfMedia' ? 'parallel_self_media' : 'custom_prompt_media'}
          WHERE id = $1
        `, [mediaId]);
        
        // 3. Clean up Cloudinary assets (if we have the info)
        if (mediaInfo && mediaInfo.length > 0) {
          const imageUrl = mediaInfo[0]?.image_url;
          if (imageUrl) {
            console.log('🗑️ [delete-media] Media image URL for cleanup:', imageUrl);
            // Note: Cloudinary cleanup would require Cloudinary SDK - for now we log it
            // In production, you'd want to actually delete the Cloudinary asset
          }
        }
        
        // 4. Update user's total likes received count
        const userLikesReceived = await q(`
          SELECT COUNT(*) as total_likes 
          FROM likes l
          JOIN ${mediaTable === 'neoGlitchMedia' ? 'neo_glitch_media' :
                mediaTable === 'customPromptMedia' ? 'custom_prompt_media' :
                mediaTable === 'unrealReflectionMedia' ? 'unreal_reflection_media' :
                mediaTable === 'ghibliReactionMedia' ? 'ghibli_reaction_media' :
                mediaTable === 'presetsMedia' ? 'presets_media' :
                mediaTable === 'story' ? 'story' :
                mediaTable === 'editMedia' ? 'edit_media' :
                mediaTable === 'parallelSelfMedia' ? 'parallel_self_media' : 'custom_prompt_media'} m ON l.media_id::text = m.id::text
          WHERE m.user_id = $1
        `, [userId]);
        
        const totalLikes = userLikesReceived[0]?.total_likes || 0;
        console.log('📊 [delete-media] User total likes after deletion:', totalLikes);
        
        // 3. Update user's total likes received in users table
        await q(`
          UPDATE users 
          SET total_likes_received = $1 
          WHERE id = $2
        `, [totalLikes, userId]);
        console.log('✅ [delete-media] Updated user total likes received');
        
      } catch (cleanupError: any) {
        console.error('❌ [delete-media] Cleanup error:', cleanupError.message);
        // Don't fail the deletion if cleanup fails
      }
      
      // Verify the media was actually deleted
      try {
        const verifyResult = await q(`
          SELECT id FROM ${mediaTable === 'neoGlitchMedia' ? 'neo_glitch_media' :
                          mediaTable === 'customPromptMedia' ? 'custom_prompt_media' :
                          mediaTable === 'unrealReflectionMedia' ? 'unreal_reflection_media' :
                          mediaTable === 'ghibliReactionMedia' ? 'ghibli_reaction_media' :
                          mediaTable === 'presetsMedia' ? 'presets_media' :
                          mediaTable === 'story' ? 'story' :
                          mediaTable === 'editMedia' ? 'edit_media' :
                          mediaTable === 'parallelSelfMedia' ? 'parallel_self_media' : 'custom_prompt_media'}
          WHERE id = $1
        `, [mediaId]);
        
        if (verifyResult && verifyResult.length > 0) {
          console.error('❌ [delete-media] Media still exists after deletion!', mediaId);
          return json({ error: 'Media deletion failed - media still exists' }, { status: 500 });
        } else {
          console.log('✅ [delete-media] Deletion verified - media no longer exists');
        }
      } catch (verifyError: any) {
        console.error('❌ [delete-media] Verification failed:', verifyError.message);
      }
      
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
