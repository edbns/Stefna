const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const { userId } = verifyAuth(event)
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log(`📥 Getting user profile for: ${userId}`)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, share_to_feed, allow_remix, onboarding_completed, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Get user profile error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    // Return profile data in the format expected by the frontend
    const profileData = {
      id: profile.id,
      username: profile.username || '',
      name: profile.username || '', // Keep for backward compatibility
      avatar: profile.avatar_url || '',
      avatar_url: profile.avatar_url || '',
      shareToFeed: profile.share_to_feed || false,
      allowRemix: profile.allow_remix || false,
      onboarding_completed: profile.onboarding_completed || false,
      tier: 'registered', // Default tier
      createdAt: profile.created_at
    }

    console.log(`✅ Retrieved profile for user ${userId}:`, profileData)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profileData)
    }

  } catch (e) {
    console.error('❌ Get user profile error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Internal server error' }) 
    }
  }
}

