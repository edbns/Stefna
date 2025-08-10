const { verifyAuth } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = verifyAuth(event);
    const body = JSON.parse(event.body || "{}");

    // Required fields
    const { assetId, visibility, allowRemix } = body;
    
    if (!assetId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'assetId is required' }) 
      };
    }

    // Validate visibility
    if (visibility && !['private', 'public'].includes(visibility)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'visibility must be "private" or "public"' }) 
      };
    }

    // Validate allowRemix
    if (typeof allowRemix !== 'undefined' && typeof allowRemix !== 'boolean') {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'allowRemix must be a boolean' }) 
      };
    }

    // Build update object
    const updateData = {};
    if (visibility !== undefined) updateData.visibility = visibility;
    if (allowRemix !== undefined) updateData.allow_remix = allowRemix;

    // If no updates, return early
    if (Object.keys(updateData).length === 0) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'No valid fields to update' }) 
      };
    }

    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Moderation gate: if attempting to make public, block unsafe content based on prompt heuristics
    if (updateData.visibility === 'public') {
      const { data: assetRow, error: fetchErr } = await supabase
        .from('media_assets')
        .select('id, user_id, prompt')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();
      if (fetchErr || !assetRow) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Media asset not found or access denied' }) };
      }
      const prompt = String(assetRow.prompt || '').toLowerCase();
      const BLOCK_LIST = [
        'porn','explicit','sexual','nude','nudity','erotic','adult',
        'racist','hate','bigot','slur','kill','murder','blood','gore','suicide','self-harm'
      ];
      if (BLOCK_LIST.some(k => prompt.includes(k))) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Content blocked by moderation. Please revise your prompt before sharing publicly.' }) };
      }
    }

    // Update the media asset
    const { data: updated, error } = await supabase
      .from('media_assets')
      .update(updateData)
      .eq('id', assetId)
      .eq('user_id', userId) // Ensure user can only update their own media
      .select()
      .single();

    if (error) {
      console.error('Update media visibility error:', error);
      
      // Handle specific database constraint violations
      if (error.message.includes('Cannot allow remix on private media')) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: 'Cannot allow remix on private media. Make it public first.' }) 
        };
      }
      
      if (error.message.includes('Cannot remix')) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: error.message }) 
        };
      }
      
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: error.message }) 
      };
    }

    if (!updated) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'Media asset not found or access denied' }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify(updated) 
    };
  } catch (error) {
    console.error('updateMediaVisibility error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
