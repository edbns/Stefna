const { sql } = require('./_db');
const { requireAuth, httpErr } = require('./_auth');

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Use centralized auth
    const { userId } = requireAuth(event.headers.authorization);
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
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        ok: true, 
        profile: profile || null,
        message: profile ? 'Profile loaded successfully' : 'Profile creation failed'
      })
    };

  } catch (error) {
    console.error('❌ Get user profile error:', error);
    const status = error.statusCode || 500;
    const code = error.code || 'INTERNAL_ERROR';
    
    return {
      statusCode: status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        ok: false, 
        error: code,
        details: error.message 
      })
    };
  }
};

