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

    // ---- Auth check using JWT ----
    const user = requireJWTUser(event)
    if (!user) {
      return resp(401, { error: 'Unauthorized - Invalid or missing JWT token' })
    }

    const sql = neon(process.env.DATABASE_URL)

    console.log('🔍 Debug: Checking media_assets table...')

    // Check total count
    let totalCount = 0;
    try {
      const countResult = await sql`SELECT COUNT(*) as count FROM media_assets`
      totalCount = parseInt(countResult[0]?.count || 0)
    } catch (countError) {
      console.error('❌ Count error:', countError)
      return resp(500, { error: countError.message })
    }

    // Check by visibility
    let publicMedia = [];
    try {
      publicMedia = await sql`
        SELECT id, visibility, env, created_at, owner_id as user_id
        FROM media_assets 
        WHERE visibility = 'public' 
        LIMIT 10
      `
    } catch (publicError) {
      console.error('❌ Public media error:', publicError)
      return resp(500, { error: publicError.message })
    }

    // Check by environment
    let prodMedia = [];
    try {
      prodMedia = await sql`
        SELECT id, visibility, env, created_at, owner_id as user_id
        FROM media_assets 
        WHERE env = 'production' 
        LIMIT 10
      `
    } catch (prodError) {
      console.error('❌ Prod media error:', prodError)
      return resp(500, { error: prodError.message })
    }

    // Check your specific media (if you provide user_id)
    let userMedia = [];
    try {
      userMedia = await sql`
        SELECT id, visibility, env, created_at, owner_id as user_id, meta->>'prompt' as prompt
        FROM media_assets 
        ORDER BY created_at DESC 
        LIMIT 20
      `
    } catch (userError) {
      console.error('❌ User media error:', userError)
      return resp(500, { error: userError.message })
    }

    const debugInfo = {
      totalCount,
      publicCount: publicMedia?.length || 0,
      prodCount: prodMedia?.length || 0,
      publicMedia: publicMedia?.slice(0, 5) || [],
      prodMedia: prodMedia?.slice(0, 5) || [],
      recentMedia: userMedia?.slice(0, 10) || [],
      environment: {
        PUBLIC_APP_ENV: process.env.PUBLIC_APP_ENV,
        NODE_ENV: process.env.NODE_ENV
      }
    }

    console.log('🔍 Debug info:', debugInfo)

    return resp(200, debugInfo)

  } catch (e) {
    console.error('❌ Debug function error:', e)
    return resp(500, { error: e?.message || 'Debug function crashed' })
  }
}

