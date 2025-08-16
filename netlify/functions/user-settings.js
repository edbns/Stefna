const { neon } = require('@neondatabase/serverless')
const { verifyAuth } = require('./_auth')

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL)

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      return { 
        statusCode: 405, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'Method Not Allowed' 
      }
    }

    // Verify user authentication
    const { userId } = verifyAuth(event)
    if (!userId) {
      return { 
        statusCode: 401, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authentication required' }) 
      }
    }

    if (event.httpMethod === 'GET') {
      // Get user settings
      console.log(`📥 Getting settings for user: ${userId}`)
      
      try {
        const settings = await sql`
          SELECT share_to_feed, allow_remix, updated_at
          FROM user_settings
          WHERE user_id = ${userId}
        `;

        // Return default settings if none exist
        const defaultSettings = {
          share_to_feed: true,  // Default to sharing
          allow_remix: true,    // Default to allowing remix
          updated_at: null
        }

        const result = settings.length > 0 ? settings[0] : defaultSettings
        console.log(`✅ Retrieved settings for user ${userId}:`, result)

        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            shareToFeed: result.share_to_feed,
            allowRemix: result.allow_remix,
            updatedAt: result.updated_at
          })
        }
      } catch (dbError) {
        console.error('❌ Get settings error:', dbError)
        // Return default settings on error
        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            shareToFeed: true,
            allowRemix: true,
            updatedAt: null
          })
        }
      }
    }

    if (event.httpMethod === 'POST') {
      // Update user settings
      const body = JSON.parse(event.body || '{}')
      const { shareToFeed, allowRemix } = body

      if (typeof shareToFeed !== 'boolean' || typeof allowRemix !== 'boolean') {
        return { 
          statusCode: 400, 
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'shareToFeed and allowRemix must be boolean' }) 
        }
      }

      console.log(`📝 Updating settings for user ${userId}:`, { shareToFeed, allowRemix })

      try {
        // Upsert settings (create if doesn't exist, update if it does)
        const updated = await sql`
          INSERT INTO user_settings (user_id, share_to_feed, allow_remix, updated_at)
          VALUES (${userId}, ${shareToFeed}, ${allowRemix}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET 
            share_to_feed = EXCLUDED.share_to_feed,
            allow_remix = EXCLUDED.allow_remix,
            updated_at = NOW()
          RETURNING share_to_feed, allow_remix, updated_at
        `;

        const result = updated[0]
        console.log(`✅ Updated settings for user ${userId}:`, result)

        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            shareToFeed: result.share_to_feed,
            allowRemix: result.allow_remix,
            updatedAt: result.updated_at
          })
        }
      } catch (dbError) {
        console.error('❌ Update settings error:', dbError)
        return { 
          statusCode: 500, 
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to update settings' }) 
        }
      }
    }

  } catch (e) {
    console.error('❌ user-settings error:', e)
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }) 
    }
  }
}
