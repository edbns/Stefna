const { neon } = require('@neondatabase/serverless')
const { requireJWTUser, resp, handleCORS, sanitizeDatabaseUrl } = require('./_auth')

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

    // Connect to Neon database with safe URL sanitization
    const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
    if (!cleanDbUrl) {
      throw new Error('NETLIFY_DATABASE_URL environment variable is required');
    }
    const sql = neon(cleanDbUrl);

    console.log(`📥 Getting user profile for: ${user.userId}`)

    // First ensure user exists in users table
    let userData;
    try {
      const userResult = await sql`
        INSERT INTO users (id, email, external_id, created_at, updated_at)
        VALUES (${user.userId}, ${user.email || `user-${user.userId}@placeholder.com`}, ${user.userId}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          updated_at = NOW()
        RETURNING id, name, email, tier
      `;
      userData = userResult[0];
      console.log(`✅ User ensured in users table:`, userData);
    } catch (userError) {
      console.error('❌ Error ensuring user:', userError);
      return resp(500, { error: 'Failed to ensure user exists' });
    }

    // Get profile data from user_settings (may not exist yet)
    let profile;
    try {
      const profileResult = await sql`
        SELECT id, username, share_to_feed, allow_remix, updated_at
        FROM user_settings 
        WHERE user_id = ${user.userId}
      `;
      if (profileResult && profileResult.length > 0) {
        profile = profileResult[0];
        console.log(`✅ Found existing profile settings:`, profile);
      } else {
        console.log(`ℹ️ No profile settings found for user ${user.userId}, will create defaults`);
      }
    } catch (profileError) {
      console.log('Profile settings not found, will create defaults:', profileError.message);
    }

    // If no profile settings exist, create them
    if (!profile) {
      try {
        const defaultUsername = `user-${user.userId.slice(-6)}`;
        const newProfile = await sql`
          INSERT INTO user_settings (user_id, username, share_to_feed, allow_remix, created_at, updated_at)
          VALUES (${user.userId}, ${defaultUsername}, false, false, NOW(), NOW())
          RETURNING id, username, share_to_feed, allow_remix, created_at, updated_at
        `;
        profile = newProfile[0];
        console.log(`✅ Created default profile settings:`, profile);
      } catch (createError) {
        console.error('❌ Failed to create profile settings:', createError);
        // Continue with empty profile
        profile = {
          id: user.userId,
          username: `user-${user.userId.slice(-6)}`,
          share_to_feed: false,
          allow_remix: false,
          updated_at: new Date().toISOString()
        };
      }
    }

    // Return profile data in the format expected by the frontend
    const profileData = {
      id: user.userId, // Always use the real user ID from JWT
      username: profile.username || `user-${user.userId.slice(-6)}`,
      name: profile.username || `user-${user.userId.slice(-6)}`, // Keep for backward compatibility
      avatar: '', // No avatar_url in user_settings yet
      avatar_url: '',
      shareToFeed: profile.share_to_feed || false,
      allowRemix: profile.allow_remix || false,
      onboarding_completed: false, // Not in user_settings yet
      tier: userData.tier || 'registered',
      createdAt: profile.updated_at || new Date().toISOString()
    }

    console.log(`✅ Retrieved profile for user ${user.userId}:`, profileData)

    return resp(200, profileData)

  } catch (e) {
    console.error('❌ Get user profile error:', e)
    
    // Return safe defaults instead of 500 to prevent UI crashes
    const fallbackProfile = {
      id: null, // This will be fixed by the frontend fallback
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

