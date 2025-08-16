const { neon } = require('@neondatabase/serverless');
const { requireJWTUser, resp, handleCORS } = require('./_auth');

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  if (event.httpMethod !== 'PUT') {
    return resp(405, { error: 'Method not allowed' });
  }

  try {
    const user = requireJWTUser(event);
    if (!user) {
      return resp(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || "{}");

    // Required fields
    const { assetId, visibility, allowRemix } = body;
    
    if (!assetId) {
      return resp(400, { error: 'assetId is required' });
    }

    // Validate visibility
    if (visibility && !['private', 'public'].includes(visibility)) {
      return resp(400, { error: 'visibility must be "private" or "public"' });
    }

    // Validate allowRemix
    if (typeof allowRemix !== 'undefined' && typeof allowRemix !== 'boolean') {
      return resp(400, { error: 'allowRemix must be a boolean' });
    }

    // Build update object
    const updateData = {};
    if (visibility !== undefined) updateData.visibility = visibility;
    if (allowRemix !== undefined) updateData.allow_remix = allowRemix;

    // If no updates, return early
    if (Object.keys(updateData).length === 0) {
      return resp(400, { error: 'No valid fields to update' });
    }

    // Moderation gate: if attempting to make public, block unsafe content based on prompt heuristics
    if (updateData.visibility === 'public') {
      try {
        const assetRows = await sql`
          SELECT id, owner_id, meta
          FROM media_assets 
          WHERE id = ${assetId} AND owner_id = ${user.userId}
        `;
        
        if (!assetRows || assetRows.length === 0) {
          return resp(404, { error: 'Media asset not found or access denied' });
        }
        
        const assetRow = assetRows[0];
        const prompt = String(assetRow.meta?.prompt || '').toLowerCase();
        const BLOCK_LIST = [
          'porn','explicit','sexual','nude','nudity','erotic','adult',
          'racist','hate','bigot','slur','kill','murder','blood','gore','suicide','self-harm'
        ];
        if (BLOCK_LIST.some(k => prompt.includes(k))) {
          return resp(400, { error: 'Content blocked by moderation. Please revise your prompt before sharing publicly.' });
        }
      } catch (fetchErr) {
        console.error('Error fetching asset for moderation:', fetchErr);
        return resp(404, { error: 'Media asset not found or access denied' });
      }
    }

    // Update the media asset
    try {
      const updatedRows = await sql`
        UPDATE media_assets 
        SET 
          ${updateData.visibility !== undefined ? sql`visibility = ${updateData.visibility}` : sql``},
          ${updateData.allow_remix !== undefined ? sql`allow_remix = ${updateData.allow_remix}` : sql``},
          updated_at = NOW()
        WHERE id = ${assetId} AND owner_id = ${user.userId}
        RETURNING id, url, resource_type, created_at, public_id, width, height, 
                  visibility, allow_remix, meta, updated_at
      `;
      
      if (!updatedRows || updatedRows.length === 0) {
        return resp(404, { error: 'Media asset not found or access denied' });
      }
      
      const updated = updatedRows[0];
      return resp(200, { 
        ok: true,
        data: updated
      });
      
    } catch (updateErr) {
      console.error('Update media visibility error:', updateErr);
      
      // Handle specific database constraint violations
      if (updateErr.message.includes('Cannot allow remix on private media')) {
        return resp(400, { error: 'Cannot allow remix on private media. Make it public first.' });
      }
      
      if (updateErr.message.includes('Cannot remix')) {
        return resp(400, { error: updateErr.message });
      }
      
      return resp(400, { error: updateErr.message || 'Update failed' });
    }
  } catch (error) {
    console.error('updateMediaVisibility error:', error);
    return resp(500, { error: 'Internal server error' });
  }
};
