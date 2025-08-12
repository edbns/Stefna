const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    // Verify user authentication
    const { userId } = verifyAuth(event)
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    if (event.httpMethod === 'GET') {
      // Get user settings
      console.log(`📥 Getting settings for user: ${userId}`)
      
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('share_to_feed, allow_remix, updated_at')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Get settings error:', error)
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
      }

      // Return default settings if none exist
      const defaultSettings = {
        share_to_feed: true,  // Default to sharing
        allow_remix: true,    // Default to allowing remix
        updated_at: null
      }

      const result = settings || defaultSettings
      console.log(`✅ Retrieved settings for user ${userId}:`, result)

      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shareToFeed: result.share_to_feed,
          allowRemix: result.allow_remix,
          updatedAt: result.updated_at
        })
      }
    }

    if (event.httpMethod === 'POST') {
      // Update user settings
      const body = JSON.parse(event.body || '{}')
      const { shareToFeed, allowRemix } = body

      if (typeof shareToFeed !== 'boolean' || typeof allowRemix !== 'boolean') {
        return { statusCode: 400, body: JSON.stringify({ error: 'shareToFeed and allowRemix must be boolean' }) }
      }

      console.log(`📝 Updating settings for user ${userId}:`, { shareToFeed, allowRemix })

      // Upsert settings (create if doesn't exist, update if it does)
      const { data: updated, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          share_to_feed: shareToFeed,
          allow_remix: allowRemix,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select('share_to_feed, allow_remix, updated_at')
        .single()

      if (error) {
        console.error('❌ Update settings error:', error)
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
      }

      console.log(`✅ Updated settings for user ${userId}:`, updated)

      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shareToFeed: updated.share_to_feed,
          allowRemix: updated.allow_remix,
          updatedAt: updated.updated_at
        })
      }
    }

  } catch (e) {
    console.error('❌ User settings error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Internal server error' }) 
    }
  }
}
