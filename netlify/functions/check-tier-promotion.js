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

    // Auth check using JWT
    const user = requireJWTUser(event)
    if (!user) {
      return resp(401, { error: 'Unauthorized - Invalid or missing JWT token' })
    }

    console.log(`🔍 Checking tier promotion for user: ${user.userId}`)

    // Connect to Neon database
    const sql = neon(process.env.NETLIFY_DATABASE_URL)

    try {
      // Check if promotions table exists and has data
      const promotions = await sql`
        SELECT * FROM promotions 
        WHERE user_id = ${user.userId}
        ORDER BY created_at DESC 
        LIMIT 1
      `

      if (promotions && promotions.length > 0) {
        const recentPromotion = promotions[0]
        const promotionTime = new Date(recentPromotion.created_at)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        
        if (promotionTime > oneHourAgo) {
          console.log(`🎉 User ${user.userId} was recently promoted to ${recentPromotion.to_tier}`)
          
          return resp(200, {
            promoted: true,
            newTier: recentPromotion.to_tier,
            oldTier: recentPromotion.from_tier || 'registered',
            message: recentPromotion.to_tier === 'verified' 
              ? 'Congratulations! You\'ve been promoted to Verified Creator! 🎉'
              : 'Amazing! You\'ve reached Contributor status! 🌟',
            promotedAt: recentPromotion.created_at
          })
        }
      }

      // No recent promotion - return safe response
      return resp(200, {
        promoted: false,
        changed: false,
        message: 'No recent promotion'
      })

    } catch (dbError) {
      // Table doesn't exist or other DB error - return safe response
      console.log('Promotions table not available, returning safe response')
      return resp(200, {
        promoted: false,
        changed: false,
        message: 'Tier system not yet implemented'
      })
    }

  } catch (e) {
    console.error('❌ Check tier promotion error:', e)
    return resp(500, { error: e?.message || 'Internal server error' })
  }
}

