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

    // First verify user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, tier')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ User not found in users table:', userError)
      return { statusCode: 401, body: JSON.stringify({ error: 'User not found' }) }
    }

    // Get profile data (may not exist yet)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, share_to_feed, allow_remix, onboarding_completed, created_at, updated_at')
      .eq('id', userId)
      .single()

    // If profile doesn't exist (PGRST116), return safe defaults instead of 500
    if (error && error.code === 'PGRST116') {
      console.log(`⚠️ Profile not found for user ${userId}, returning defaults with user data`)
      const defaultProfile = {
        id: userId,
        username: '',
        name: user.name || '',
        email: user.email || '',
        avatar: '',
        avatar_url: '',
        shareToFeed: false,
        allowRemix: false,
        onboarding_completed: false,
        tier: user.tier || 'registered',
        createdAt: new Date().toISOString()
      }
      
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(defaultProfile)
      }
    }
    
    if (error) {
      console.error('❌ Get user profile error:', error)
      // Return safe defaults instead of 500 to prevent UI crashes
      const safeProfile = {
        id: userId,
        username: '',
        name: '',
        avatar: '',
        avatar_url: '',
        shareToFeed: false,
        allowRemix: false,
        onboarding_completed: false,
        tier: 'registered',
        createdAt: new Date().toISOString()
      }
      
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(safeProfile)
      }
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
    
    // Return safe defaults instead of 500 to prevent UI crashes
    const fallbackProfile = {
      id: null,
      username: '',
      name: '',
      avatar: '',
      avatar_url: '',
      shareToFeed: false,
      allowRemix: false,
      onboarding_completed: false,
      tier: 'registered',
      createdAt: new Date().toISOString()
    }
    
    return { 
      statusCode: 200, 
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fallbackProfile)
    }
  }
}

