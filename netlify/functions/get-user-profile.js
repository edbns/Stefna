const { sql, json, parseUserIdFromJWT } = require('./_db');

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return json({}, 200);
  }

  try {
    // Parse authorization header
    const auth = event.headers.authorization || '';
    if (!auth) {
      return json({ ok: false, error: 'Missing authorization header' }, 401);
    }

    const userId = await parseUserIdFromJWT(auth);
    console.log('✅ User authenticated:', userId);

    // Try to get existing profile
    let profile = await sql`
      SELECT user_id, display_name, avatar_url, plan, created_at
      FROM profiles 
      WHERE user_id = ${userId} 
      LIMIT 1
    `;
    profile = profile[0];

    // If no profile exists, create one with defaults
    if (!profile) {
      console.log('📝 Creating new profile for user:', userId);
      
      try {
        const result = await sql`
          INSERT INTO profiles (user_id, display_name, plan)
          VALUES (${userId}, ${`User-${userId.slice(-6)}`}, 'free')
          ON CONFLICT (user_id) DO NOTHING
          RETURNING user_id, display_name, avatar_url, plan, created_at
        `;
        
        if (result && result[0]) {
          profile = result[0];
          console.log('✅ Created new profile:', profile);
        } else {
          // Try to select again in case of race condition
          profile = await sql`
            SELECT user_id, display_name, avatar_url, plan, created_at
            FROM profiles 
            WHERE user_id = ${userId} 
            LIMIT 1
          `;
          profile = profile[0];
        }
      } catch (insertError) {
        console.error('❌ Failed to create profile:', insertError);
        // Continue with null profile - will be handled by frontend
      }
    }

    // Return profile data (may be null if creation failed)
    return json({ 
      ok: true, 
      profile: profile || null,
      message: profile ? 'Profile loaded successfully' : 'Profile creation failed'
    });

  } catch (error) {
    console.error('❌ Get user profile error:', error);
    return json({ 
      ok: false, 
      error: 'INTERNAL_ERROR',
      details: error.message 
    }, 500);
  }
};

