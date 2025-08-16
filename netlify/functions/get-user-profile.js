const { sql } = require('../lib/db');
const { requireUser } = require('../lib/auth');

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
    // Use the new robust auth helper
    const user = await requireUser(event);
    console.log('✅ User authenticated:', user.id);

    // Create profiles table if it doesn't exist (safe if it already exists)
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT,
        username TEXT UNIQUE,
        name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Try to get existing profile
    let profile = await sql`
      SELECT id, email, username, name, avatar_url, created_at 
      FROM profiles 
      WHERE id = ${user.id} 
      LIMIT 1
    `;
    profile = profile[0];

    // If no profile exists, create one
    if (!profile) {
      const defaultUsername = `user-${user.id.slice(-6)}`;
      profile = await sql`
        INSERT INTO profiles (id, email, username, name, avatar_url)
        VALUES (${user.id}, ${defaultUsername}, ${user.name}, ${user.avatar_url})
        ON CONFLICT (id) DO NOTHING
        RETURNING id, email, username, name, avatar_url, created_at
      `;
      profile = profile[0];
      
      // If insert didn't work, try to select again
      if (!profile) {
        profile = await sql`
          SELECT id, email, username, name, avatar_url, created_at 
          FROM profiles 
          WHERE id = ${user.id} 
          LIMIT 1
        `;
        profile = profile[0];
      }
    }

    // Guarantee id is present and never null
    profile = { ...profile, id: user.id };

    console.log('✅ Returning profile data:', profile);

    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: true, 
        profile: profile
      }) 
    };

  } catch (error) {
    const code = error?.status || 500;
    console.error(`[auth] ${error?.message}`, error);
    
    return { 
      statusCode: code, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        error: error?.message || 'Internal server error',
        message: error?.message || 'Internal server error'
      }) 
    };
  }
};

