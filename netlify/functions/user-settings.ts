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
          theme: 'dark',
          notifications: true,
          autoSave: true,
          language: 'en'
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
        INSERT INTO user_settings (user_id, theme, notifications, auto_save, language, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          theme = EXCLUDED.theme,
          notifications = EXCLUDED.notifications,
          auto_save = EXCLUDED.auto_save,
          language = EXCLUDED.language,
          updated_at = NOW()
        RETURNING *
      `, [
        userId, 
        body.theme || 'dark',
        body.notifications !== undefined ? body.notifications : true,
        body.autoSave !== undefined ? body.autoSave : true,
        body.language || 'en'
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
