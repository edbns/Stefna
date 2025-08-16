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

    // Auto-detect environment
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod'
    console.log(`📊 Getting referral stats for user ${user.userId} in ${APP_ENV}`)

    // Connect to Neon database
    const sql = neon(process.env.NETLIFY_DATABASE_URL)

    try {
      // 1. Get or create user referral record
      let referralData = await sql`
        SELECT * FROM referrals 
        WHERE referrer_id = ${user.userId}
        LIMIT 1
      `

      if (!referralData || referralData.length === 0) {
        // User doesn't have a referral record yet, create one
        const newReferral = await sql`
          INSERT INTO referrals (referrer_id, referred_email, status)
          VALUES (${user.userId}, '', 'pending')
          RETURNING *
        `
        referralData = newReferral
      }

      // 2. Get actual tokens earned from credits_ledger (more accurate than stored total)
      let actualTokensEarned = 0
      try {
        const creditData = await sql`
          SELECT amount FROM credits_ledger 
          WHERE user_id = ${user.userId} 
          AND env = ${APP_ENV}
          AND reason LIKE 'referral_bonus_%'
        `
        if (creditData && creditData.length > 0) {
          actualTokensEarned = creditData.reduce((sum, record) => sum + (record.amount || 0), 0)
        }
      } catch (creditError) {
        console.log('Credits ledger not available, using default')
      }

      // 3. Get recent referral activity
      let recentActivity = []
      try {
        const recentSignups = await sql`
          SELECT referred_email as new_user_email, created_at
          FROM referrals 
          WHERE referrer_id = ${user.userId} 
          AND env = ${APP_ENV}
          ORDER BY created_at DESC 
          LIMIT 10
        `
        recentActivity = recentSignups || []
      } catch (signupsError) {
        console.log('Referral signups not available, using empty array')
      }

      console.log(`✅ Referral stats for ${user.userId}: ${referralData.length || 0} referrals, ${actualTokensEarned} tokens earned`)

      return resp(200, {
        totalInvites: referralData.length || 0,
        tokensEarned: actualTokensEarned,
        recentActivity,
        lastInviteAt: referralData[0]?.created_at || null
      })

    } catch (dbError) {
      // Tables don't exist or other DB error - return safe response
      console.log('Referral tables not available, returning safe response')
      return resp(200, {
        totalInvites: 0,
        tokensEarned: 0,
        recentActivity: [],
        lastInviteAt: null
      })
    }

  } catch (error) {
    console.error('❌ Get referral stats error:', error)
    return resp(500, { error: error.message || 'Internal server error' })
  }
}
