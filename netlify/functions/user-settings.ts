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
        SELECT media_upload_agreed, share_to_feed FROM user_settings WHERE user_id = $1
      `, [userId]);

      if (!settings || settings.length === 0) {
        // Return default settings if none exist
        const defaultSettings = {
          media_upload_agreed: false,
          share_to_feed: true
        };
        
        return json({ settings: defaultSettings });
      }

      return json({ settings: settings[0] });
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const { userId } = requireAuth(event.headers.authorization);
      const body = JSON.parse(event.body || '{}')
      
      // Get existing settings first to preserve values
      const existingSettings = await qOne(`
        SELECT media_upload_agreed, share_to_feed FROM user_settings WHERE user_id = $1
      `, [userId]);
      
      // Use body values if provided, otherwise keep existing values
      const mediaUploadAgreed = body.media_upload_agreed !== undefined ? body.media_upload_agreed : 
                                body.mediaUploadAgreed !== undefined ? body.mediaUploadAgreed : 
                                (existingSettings?.media_upload_agreed ?? false);
      
      const shareToFeed = body.share_to_feed !== undefined ? body.share_to_feed : 
                          body.shareToFeed !== undefined ? body.shareToFeed : 
                          (existingSettings?.share_to_feed ?? true); // Default to true for new users
      
      // 🔧 DEBUG: Log the exact values being processed
      console.log('🔧 [User Settings] Processing update:', {
        userId,
        bodyKeys: Object.keys(body),
        bodyValues: body,
        existingSettings,
        finalMediaUploadAgreed: mediaUploadAgreed,
        finalShareToFeed: shareToFeed,
        existingShareToFeed: existingSettings?.share_to_feed,
        existingMediaUploadAgreed: existingSettings?.media_upload_agreed
      });
      
      console.log('🔧 [User Settings] Update request:', {
        userId,
        body,
        existingSettings,
        finalMediaUploadAgreed: mediaUploadAgreed,
        finalShareToFeed: shareToFeed
      });
      
      // Upsert user settings
      const updated = await q(`
        INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          media_upload_agreed = EXCLUDED.media_upload_agreed,
          share_to_feed = EXCLUDED.share_to_feed,
          updated_at = NOW()
        RETURNING *
      `, [userId, mediaUploadAgreed, shareToFeed]);

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
