import type { Handler } from "@netlify/functions";
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!);

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    // Auth check using JWT
    const { userId } = requireAuth(event.headers.authorization)
    if (!userId) {
      return json({ error: 'Unauthorized - Invalid or missing JWT token' }, { status: 401 })
    }

    if (event.httpMethod === 'GET') {
      // Get user settings
      console.log(`📥 Getting settings for user: ${userId}`)
      
      try {
        const settings = await sql`
          SELECT share_to_feed, updated_at
          FROM user_settings
          WHERE user_id = ${userId}
        `;

        // Return default settings if none exist
        const defaultSettings = {
          share_to_feed: true,  // Default to sharing
          updated_at: null
        }

        const result = settings.length > 0 ? settings[0] : defaultSettings
        console.log(`✅ Retrieved settings for user ${userId}:`, result)

        return json({
          shareToFeed: result.share_to_feed,
          updatedAt: result.updated_at
        })
      } catch (dbError) {
        console.error('❌ Get settings error:', dbError)
        // Return default settings on error
        return json({
          shareToFeed: true,
          updatedAt: null
        })
      }
    }

    if (event.httpMethod === 'POST') {
      // Update user settings
      const body = JSON.parse(event.body || '{}')
      const { shareToFeed } = body

      if (typeof shareToFeed !== 'boolean') {
        return json({ error: 'shareToFeed must be boolean' }, { status: 400 })
      }

      console.log(`📝 Updating settings for user ${userId}:`, { shareToFeed })

      try {
        // Upsert settings (create if doesn't exist, update if it does)
        const updated = await sql`
          INSERT INTO user_settings (user_id, share_to_feed, updated_at)
          VALUES (${userId}, ${shareToFeed}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET 
            share_to_feed = EXCLUDED.share_to_feed,
            updated_at = NOW()
          RETURNING share_to_feed, updated_at
        `;

        const result = updated[0]
        console.log(`✅ Updated settings for user ${userId}:`, result)

        return json({
          shareToFeed: result.share_to_feed,
          updatedAt: result.updated_at
        })
      } catch (dbError) {
        console.error('❌ Update settings error:', dbError)
        return json({ error: 'Failed to update settings' }, { status: 500 })
      }
    }

  } catch (e) {
    console.error('❌ user-settings error:', e)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}
