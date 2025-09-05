import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Get user from authorization header
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const token = authHeader.substring(7);
  let userId: string;

  try {
    // Verify token and get user ID
    const user = await qOne(`
      SELECT id FROM users WHERE auth_token = $1 AND auth_token_expires_at > NOW()
    `, [token]);
    
    if (!user) {
      return json({ error: 'Invalid or expired token' }, { status: 401, headers });
    }
    
    userId = user.id;
  } catch (error) {
    console.error('Token verification failed:', error);
    return json({ error: 'Authentication failed' }, { status: 401, headers });
  }

  if (event.httpMethod === 'GET') {
    // Get user drafts
    const { limit = '50', offset = '0' } = event.queryStringParameters || {};
    
    // Ensure valid numbers
    const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 50));
    const offsetNum = Math.max(0, parseInt(offset) || 0);
    
    try {
      const drafts = await q(`
        SELECT 
          id,
          user_id,
          media_url,
          prompt,
          media_type,
          aspect_ratio,
          width,
          height,
          metadata,
          created_at,
          updated_at
        FROM user_drafts 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limitNum, offsetNum]);

      const totalCount = await qOne(`
        SELECT COUNT(*) as total FROM user_drafts WHERE user_id = $1
      `, [userId]);

      return json({ 
        drafts, 
        total: totalCount?.total || 0,
                limit: limitNum,
        offset: offsetNum 
      }, { headers });

    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      return json({ error: 'Failed to fetch drafts' }, { status: 500, headers });
    }

  } else if (event.httpMethod === 'POST') {
    // Save new draft
    try {
      const { media_url, prompt, media_type, aspect_ratio, width, height, metadata } = JSON.parse(event.body || '{}');
      
      if (!media_url || !prompt || !media_type) {
        return json({ error: 'Missing required fields' }, { status: 400, headers });
      }

      const newDraft = await qOne(`
        INSERT INTO user_drafts (
          user_id, media_url, prompt, media_type, aspect_ratio, width, height, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        userId, 
        media_url, 
        prompt, 
        media_type, 
        aspect_ratio || 1.33, 
        width || 800, 
        height || 600, 
        metadata || {}
      ]);

      return json({ draft: newDraft }, { headers });

    } catch (error) {
      console.error('Failed to save draft:', error);
      return json({ error: 'Failed to save draft' }, { status: 500, headers });
    }

  } else if (event.httpMethod === 'PUT') {
    // Update existing draft
    try {
      const { id, media_url, prompt, media_type, aspect_ratio, width, height, metadata } = JSON.parse(event.body || '{}');
      
      if (!id) {
        return json({ error: 'Draft ID required' }, { status: 400, headers });
      }

      const updatedDraft = await qOne(`
        UPDATE user_drafts 
        SET 
          media_url = COALESCE($2, media_url),
          prompt = COALESCE($3, prompt),
          media_type = COALESCE($4, media_type),
          aspect_ratio = COALESCE($5, aspect_ratio),
          width = COALESCE($6, width),
          height = COALESCE($7, height),
          metadata = COALESCE($8, metadata),
          updated_at = NOW()
        WHERE id = $1 AND user_id = $9
        RETURNING *
      `, [id, media_url, prompt, media_type, aspect_ratio, width, height, metadata, userId]);

      if (!updatedDraft) {
        return json({ error: 'Draft not found or access denied' }, { status: 404, headers });
      }

      return json({ draft: updatedDraft }, { headers });

    } catch (error) {
      console.error('Failed to update draft:', error);
      return json({ error: 'Failed to update draft' }, { status: 500, headers });
    }

  } else if (event.httpMethod === 'DELETE') {
    // Delete draft
    try {
      const { id } = event.queryStringParameters || {};
      
      if (!id) {
        return json({ error: 'Draft ID required' }, { status: 400, headers });
      }

      const result = await qOne(`
        DELETE FROM user_drafts 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [id, userId]);

      if (!result) {
        return json({ error: 'Draft not found or access denied' }, { status: 404, headers });
      }

      return json({ success: true, message: 'Draft deleted successfully' }, { headers });

    } catch (error) {
      console.error('Failed to delete draft:', error);
      return json({ error: 'Failed to delete draft' }, { status: 500, headers });
    }
  }

  return json({ error: 'Method not allowed' }, { status: 405, headers });
};
