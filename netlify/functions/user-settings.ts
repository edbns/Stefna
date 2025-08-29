import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne, qCount for database operations
// - Manages user settings
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
      }
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const { userId } = requireAuth(event.headers.authorization);
      
      // Get user settings
      const settings = await q(`
        SELECT * FROM user_settings WHERE user_id = $1
      `, [userId]);

      if (!settings || settings.length === 0) {
        // Return default settings if none exist
        const defaultSettings = {
          share_to_feed: true,
          allow_remix: true,
          media_upload_agreed: false
        };
        
        return json({ settings: defaultSettings });
      }

      return json({ settings: settings[0] });
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const { userId } = requireAuth(event.headers.authorization);
      const body = JSON.parse(event.body || '{}')
      
      // Upsert user settings
      const updated = await q(`
        INSERT INTO user_settings (user_id, share_to_feed, allow_remix, media_upload_agreed, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          share_to_feed = EXCLUDED.share_to_feed,
          allow_remix = EXCLUDED.allow_remix,
          media_upload_agreed = EXCLUDED.media_upload_agreed,
          updated_at = NOW()
        RETURNING *
      `, [
        userId, 
        body.share_to_feed !== undefined ? body.share_to_feed : true,
        body.allow_remix !== undefined ? body.allow_remix : true,
        body.media_upload_agreed !== undefined ? body.media_upload_agreed : false
      ]);

      if (!updated || updated.length === 0) {
        throw new Error('Failed to update user settings');
      }

      return json({ 
        success: true, 
        settings: updated[0],
        message: 'Settings updated successfully' 
      });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });

  } catch (error) {
    console.error('💥 [User Settings] Error:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
