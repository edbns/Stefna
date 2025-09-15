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
      // Be tolerant to header casing differences
      const authHeader = (event.headers.authorization || (event.headers as any)?.Authorization || (event.headers as any)['AUTHORIZATION']) as string | undefined;
      const { userId } = requireAuth(authHeader);
      
      // Get user settings
      const settings = await q(`
        SELECT media_upload_agreed, share_to_feed FROM user_settings WHERE user_id = $1
      `, [userId]);

      if (!settings || settings.length === 0) {
        // Return default settings if none exist
        const defaultSettings = {
          media_upload_agreed: false,
          share_to_feed: false
        };
        
        return json({ settings: defaultSettings });
      }

      return json({ settings: settings[0] });
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const authHeader = (event.headers.authorization || (event.headers as any)?.Authorization || (event.headers as any)['AUTHORIZATION']) as string | undefined;
      const { userId, platform, permissions } = requireAuth(authHeader);
      const body = JSON.parse(event.body || '{}')
      
      // Get existing settings first to preserve values
      const existingSettings = await qOne(`
        SELECT media_upload_agreed, share_to_feed FROM user_settings WHERE user_id = $1
      `, [userId]);
      
      // Use body values if provided, otherwise keep existing values
      const mediaUploadAgreed = body.media_upload_agreed !== undefined ? body.media_upload_agreed : 
                                body.mediaUploadAgreed !== undefined ? body.mediaUploadAgreed : 
                                (existingSettings?.media_upload_agreed ?? false);
      
      // Enforce permission for website-only feed toggle
      let shareToFeed = existingSettings?.share_to_feed ?? false;
      if (body.share_to_feed !== undefined || body.shareToFeed !== undefined) {
        const requested = (body.share_to_feed !== undefined ? body.share_to_feed : body.shareToFeed) as boolean;
        // Allow web with proper permission only
        if (Array.isArray(permissions) && permissions.includes('canManageFeed')) {
          shareToFeed = requested;
        } else {
          // Explicitly log and keep existing value for non-permitted tokens
          console.warn('🚫 [User Settings] share_to_feed update denied due to missing permission', { userId, platform, requested });
        }
      }

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

      const updatedRow = updated[0];

      // Audit log: capture both feed fields when they change
      const changes: Array<{ field: string; oldv: any; newv: any; }> = [];
      if ((existingSettings?.share_to_feed ?? false) !== updatedRow.share_to_feed) {
        changes.push({ field: 'share_to_feed', oldv: existingSettings?.share_to_feed, newv: updatedRow.share_to_feed });
      }
      // Optional audit logging - don't fail if table doesn't exist
      try {
        for (const c of changes) {
          await q(`
            INSERT INTO settings_audit_log (user_id, field, old_value, new_value, platform)
            VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
          `, [userId, c.field, JSON.stringify(c.oldv), JSON.stringify(c.newv), platform || 'unknown']);
        }
      } catch (auditError) {
        console.warn('⚠️ [User Settings] Audit logging failed (table may not exist):', auditError?.message);
        // Continue without failing the main operation
      }

      return json({ 
        success: true, 
        settings: updatedRow,
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
