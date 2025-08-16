const { neon } = require('@neondatabase/serverless')
const { requireJWTUser, resp, handleCORS } = require('./_auth')

exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    if (event.httpMethod !== 'GET') {
      return resp(405, { error: 'Method Not Allowed' })
    }

    // Auth check using JWT
    const user = requireJWTUser(event)
    if (!user) {
      return resp(401, { error: 'Unauthorized - Invalid or missing JWT token' })
    }

    // Connect to Neon database
    const sql = neon(process.env.NETLIFY_DATABASE_URL)

    console.log(`📥 Getting user profile for: ${user.userId}`)

    // First verify user exists in users table
    let userData;
    try {
      const userResult = await sql`
        SELECT id, name, email, tier FROM users WHERE id = ${user.userId}
      `
      if (!userResult || userResult.length === 0) {
        console.error('❌ User not found in users table')
        return resp(401, { error: 'User not found' })
      }
      userData = userResult[0]
    } catch (userError) {
      console.error('❌ Error checking user:', userError)
      return resp(401, { error: 'User not found' })
    }

    // Get profile data (may not exist yet)
    let profile;
    try {
      const profileResult = await sql`
        SELECT id, username, share_to_feed, allow_remix, updated_at
        FROM user_settings 
        WHERE user_id = ${user.userId}
      `
      if (profileResult && profileResult.length > 0) {
        profile = profileResult[0]
      }
    } catch (profileError) {
      console.log('Profile not found, will use defaults')
    }

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
      avatar: '', // No avatar_url in user_settings
      avatar_url: '',
      shareToFeed: profile.share_to_feed || false,
      allowRemix: profile.allow_remix || false,
      onboarding_completed: false, // Not in user_settings
      tier: 'registered', // Default tier
      createdAt: profile.updated_at || new Date().toISOString()
    }

    console.log(`✅ Retrieved profile for user ${user.userId}:`, profileData)

    return resp(200, profileData)

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
    
    return resp(200, fallbackProfile)
  }
}

