const { sql } = require('../lib/db');
const { getAuthedUser } = require('../lib/auth');

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { user, error } = await getAuthedUser(event);
    if (!user) {
      console.error('❌ Authentication failed:', error);
      return { 
        statusCode: 401, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          message: error || 'Not authenticated',
          error: error || 'Not authenticated'
        }) 
      };
    }

    console.log('✅ User authenticated:', user.id);

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
      return { 
        statusCode: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to ensure user exists' }) 
      };
    }

    // Get or create profile settings
    let profile = await sql`
      SELECT id, username, share_to_feed, allow_remix, created_at, updated_at
      FROM user_settings 
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    profile = profile[0];

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
        profile = {
          id: user.id,
          username: `user-${user.id.slice(-6)}`,
          share_to_feed: false,
          allow_remix: false,
          updated_at: new Date().toISOString()
        };
      }
    }

    // Combine user data and profile settings
    const profileData = {
      id: user.id, // Always use the real user ID from JWT
      email: userData.email,
      name: userData.name,
      username: profile.username,
      avatar_url: userData.avatar_url,
      share_to_feed: profile.share_to_feed,
      allow_remix: profile.allow_remix,
      tier: userData.tier,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    console.log('✅ Returning profile data:', profileData);

    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: true, 
        profile: profileData 
      }) 
    };

  } catch (error) {
    console.error('❌ Unexpected error in get-user-profile:', error);
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        error: 'Internal server error',
        message: error.message || 'Internal server error'
      }) 
    };
  }
};

