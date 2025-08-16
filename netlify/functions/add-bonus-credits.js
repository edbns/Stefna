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
      return resp(401, { error: 'Authentication required' })
    }

    const { amount, reason } = JSON.parse(event.body || '{}')
    
    if (!amount || amount <= 0) {
      return { 
        statusCode: 400, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Valid amount required' }) 
      }
    }

    // Auto-detect environment
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod'
    console.log(`💰 Adding ${amount} bonus credits to user ${user.userId} in ${APP_ENV}`)

    const sql = neon(process.env.DATABASE_URL)

    // Add bonus credits to the ledger
    try {
      await sql`
        INSERT INTO credits_ledger (
          user_id, amount, reason, request_id, env, created_at
        ) VALUES (
          ${user.userId}, 
          ${amount}, 
          ${reason || 'bonus_credits'}, 
          ${`bonus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}, 
          ${APP_ENV},
          NOW()
        )
      `
    } catch (creditError) {
      console.error('❌ Failed to add bonus credits:', creditError)
      throw creditError
    }

    console.log(`✅ Added ${amount} bonus credits to user ${user.userId}`)

    return resp(200, {
      success: true,
      amount,
      reason: reason || 'bonus_credits'
    })

  } catch (error) {
    console.error('❌ Add bonus credits error:', error)
    return resp(500, { error: error.message || 'Internal server error' })
  }
}
