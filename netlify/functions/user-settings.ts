import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

// ---- Database connection ----


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
        const settings = await q(userSettings.findUnique({
          where: { userId }
        });

        // Return default settings if none exist
        const defaultSettings = {
          shareToFeed: false,      // 🔒 PRIVACY FIRST: Default to private
          mediaUploadAgreed: false, // Default to showing agreement
          updatedAt: null
        }

        const result = settings || defaultSettings
        console.log(`✅ Retrieved settings for user ${userId}:`, result)

        return json({
          shareToFeed: result.shareToFeed,
          mediaUploadAgreed: result.mediaUploadAgreed,
          updatedAt: result.updatedAt
        })
      } catch (dbError) {
        console.error('❌ Get settings error:', dbError)
        // Return default settings on error
        return json({
          shareToFeed: false,  // 🔒 PRIVACY FIRST: Default to private
          updatedAt: null
        })
      }
    }

    if (event.httpMethod === 'POST') {
      // Update user settings
      const body = JSON.parse(event.body || '{}')
      const { shareToFeed, mediaUploadAgreed } = body

      // Validate required fields
      if (typeof shareToFeed !== 'boolean') {
        return json({ error: 'shareToFeed must be boolean' }, { status: 400 })
      }
      if (mediaUploadAgreed !== undefined && typeof mediaUploadAgreed !== 'boolean') {
        return json({ error: 'mediaUploadAgreed must be boolean' }, { status: 400 })
      }

      console.log(`📝 Updating settings for user ${userId}:`, { shareToFeed, mediaUploadAgreed })

      try {
        // Upsert settings (create if doesn't exist, update if it does)
        const updated = await q(userSettings.upsert({
          where: { userId },
          update: { 
            shareToFeed,
            ...(mediaUploadAgreed !== undefined && { mediaUploadAgreed }),
            updatedAt: new Date()
          },
          create: {
            id: `settings-${userId}`,
            userId,
            shareToFeed,
            mediaUploadAgreed: mediaUploadAgreed ?? false, // Use provided value or default
            updatedAt: new Date()
          }
        });

        console.log(`✅ Updated settings for user ${userId}:`, updated)

        return json({
          shareToFeed: updated.shareToFeed,
          mediaUploadAgreed: updated.mediaUploadAgreed,
          updatedAt: updated.updatedAt
        })
      } catch (dbError) {
        console.error('❌ Update settings error:', dbError)
        return json({ error: 'Failed to update settings' }, { status: 500 })
      }
    }

    // This should never be reached, but TypeScript needs it
    return json({ error: 'Method not implemented' }, { status: 501 })

  } catch (e) {
    console.error('❌ user-settings error:', e)
    return json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    
  }
}
