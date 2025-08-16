const { neon } = require('@neondatabase/serverless')
const { requireJWTUser, resp, handleCORS } = require('./_auth')

exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    if (event.httpMethod !== 'POST') {
      return resp(405, { error: 'Method Not Allowed' })
    }

    // ---- Auth check using JWT ----
    const user = requireJWTUser(event)
    if (!user) {
      return resp(401, { error: 'Unauthorized - Invalid or missing JWT token' })
    }

    const { incrementDaily = 0, incrementTotalPhotos = 0 } = JSON.parse(event.body || '{}')

    const sql = neon(process.env.DATABASE_URL)
    
    // Check if user_usage table exists, if not return success (graceful fallback)
    try {
      // Try to get current usage
      const currentUsage = await sql`
        SELECT daily_usage, total_photos 
        FROM user_usage 
        WHERE user_id = ${user.userId}
      `
      
      if (currentUsage.length === 0) {
        // User doesn't have usage record, create one
        await sql`
          INSERT INTO user_usage (user_id, daily_usage, total_photos, created_at, updated_at)
          VALUES (${user.userId}, 0, 0, NOW(), NOW())
        `
      }
      
      // Update usage with increments
      const updates = {}
      if (incrementDaily) updates.daily_usage = (incrementDaily === true ? 1 : Number(incrementDaily))
      if (incrementTotalPhotos) updates.total_photos = (incrementTotalPhotos === true ? 1 : Number(incrementTotalPhotos))
      
      if (Object.keys(updates).length > 0) {
        await sql`
          UPDATE user_usage 
          SET 
            daily_usage = daily_usage + ${updates.daily_usage || 0},
            total_photos = total_photos + ${updates.total_photos || 0},
            updated_at = NOW()
          WHERE user_id = ${user.userId}
        `
      }
      
      // Get updated usage
      const updatedUsage = await sql`
        SELECT daily_usage, total_photos 
        FROM user_usage 
        WHERE user_id = ${user.userId}
      `
      
      return resp(200, { 
        success: true, 
        data: updatedUsage[0] || { daily_usage: 0, total_photos: 0 }
      })
      
    } catch (dbError) {
      // If user_usage table doesn't exist, return graceful fallback
      console.log('⚠️ user_usage table not found, returning fallback response')
      return resp(200, { 
        success: true, 
        data: { daily_usage: 0, total_photos: 0 },
        note: 'Usage tracking not available'
      })
    }
    
  } catch (e) {
    console.error('❌ Usage stats error:', e)
    return resp(500, { error: e.message || 'Usage stats function failed' })
  }
}


