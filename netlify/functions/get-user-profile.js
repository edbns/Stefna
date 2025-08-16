const { sql } = require('../lib/db');
const { getAuthedUser } = require('../lib/auth');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // Use new auth helper
    const { user, error } = await getAuthedUser(event);
    if (!user || error) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, message: 'Not authenticated' }) };
    }

    console.log(`📥 Getting user profile for: ${user.id}`);

    // First ensure user exists in users table
    let userData;
    try {
      const userResult = await sql`
        INSERT INTO users (id, email, external_id, created_at, updated_at)
        VALUES (${user.id}, ${user.email || `user-${user.id}@placeholder.com`}, ${user.id}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          updated_at = NOW()
        RETURNING id, name, email, tier, avatar_url
      `;
      userData = userResult[0];
      console.log(`✅ User ensured in users table:`, userData);
    } catch (userError) {
      console.error('❌ Error ensuring user:', userError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to ensure user exists' }) };
    }

    // Get profile data from user_settings (may not exist yet)
    let profile;
    try {
      const profileResult = await sql`
        SELECT id, username, share_to_feed, allow_remix, updated_at
        FROM user_settings 
        WHERE user_id = ${user.id}
      `;
      if (profileResult && profileResult.length > 0) {
        profile = profileResult[0];
        console.log(`✅ Found existing profile settings:`, profile);
      } else {
        console.log(`ℹ️ No profile settings found for user ${user.id}, will create defaults`);
      }
    } catch (profileError) {
      console.log('Profile settings not found, will create defaults:', profileError.message);
    }

    // If no profile settings exist, create them
    if (!profile) {
      try {
        const defaultUsername = `user-${user.id.slice(-6)}`;
        const newProfile = await sql`
          INSERT INTO user_settings (user_id, username, share_to_feed, allow_remix, created_at, updated_at)
          VALUES (${user.id}, ${defaultUsername}, false, false, NOW(), NOW())
          RETURNING id, username, share_to_feed, allow_remix, created_at, updated_at
        `;
        profile = newProfile[0];
        console.log(`✅ Created default profile settings:`, profile);
      } catch (createError) {
        console.error('❌ Failed to create profile settings:', createError);
        // Continue with empty profile
        profile = {
          id: user.id,
          username: `user-${user.id.slice(-6)}`,
          share_to_feed: false,
          allow_remix: false,
          updated_at: new Date().toISOString()
        };
      }
    }

    // Return profile data in the format expected by the frontend
    const profileData = {
      id: user.id, // Always use the real user ID from JWT
      username: profile.username || `user-${user.id.slice(-6)}`,
      name: profile.username || `user-${user.id.slice(-6)}`, // Keep for backward compatibility
      avatar: userData.avatar_url || '', // Use avatar_url from users table
      avatar_url: userData.avatar_url || '',
      shareToFeed: profile.share_to_feed || false,
      allowRemix: profile.allow_remix || false,
      onboarding_completed: false, // Not in user_settings yet
      tier: userData.tier || 'registered',
      createdAt: profile.updated_at || new Date().toISOString()
    }

    console.log(`✅ Retrieved profile for user ${user.id}:`, profileData)

    return { statusCode: 200, body: JSON.stringify({ ok: true, profile: profileData }) }

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
    
    return { statusCode: 200, body: JSON.stringify({ ok: false, profile: fallbackProfile }) }
  }
}

