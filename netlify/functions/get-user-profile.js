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

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, avatar_url, tier, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Get user profile error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    // Return profile data in the format expected by the frontend
    const profileData = {
      id: user.id,
      name: user.name || '',
      avatar: user.avatar_url || '',
      tier: user.tier || 'registered',
      createdAt: user.created_at
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

