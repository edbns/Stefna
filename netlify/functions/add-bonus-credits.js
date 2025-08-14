const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const { userId } = verifyAuth(event)
    if (!userId) {
      return { 
        statusCode: 401, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication required' }) 
      }
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
    console.log(`💰 Adding ${amount} bonus credits to user ${userId} in ${APP_ENV}`)

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Add bonus credits to the ledger
    const { error: creditError } = await supabase
      .from('credits_ledger')
      .insert({
        user_id: userId,
        amount: amount,
        reason: reason || 'bonus_credits',
        request_id: `bonus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        env: APP_ENV
      })

    if (creditError) {
      console.error('❌ Failed to add bonus credits:', creditError)
      throw creditError
    }

    console.log(`✅ Added ${amount} bonus credits to user ${userId}`)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        amount,
        reason: reason || 'bonus_credits'
      })
    }

  } catch (error) {
    console.error('❌ Add bonus credits error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    }
  }
}
