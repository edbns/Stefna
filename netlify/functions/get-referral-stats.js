const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
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

    // Auto-detect environment
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod'
    console.log(`📊 Getting referral stats for user ${userId} in ${APP_ENV}`)

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Get or create user referral record
    let { data: referralData, error: referralError } = await supabase
      .from('user_referrals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (referralError && referralError.code === 'PGRST116') {
      // User doesn't have a referral record yet, create one
      const { data: newReferral, error: createError } = await supabase
        .from('user_referrals')
        .insert({
          user_id: userId,
          total_invites: 0,
          total_tokens_earned: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create referral record:', createError)
        throw createError
      }

      referralData = newReferral
    } else if (referralError) {
      console.error('❌ Failed to get referral data:', referralError)
      throw referralError
    }

    // 2. Get actual tokens earned from credits_ledger (more accurate than stored total)
    const { data: creditData, error: creditError } = await supabase
      .from('credits_ledger')
      .select('amount')
      .eq('user_id', userId)
      .eq('env', APP_ENV)
      .like('reason', 'referral_bonus_%')

    let actualTokensEarned = 0
    if (!creditError && creditData) {
      actualTokensEarned = creditData.reduce((sum, record) => sum + (record.amount || 0), 0)
    }

    // 3. Get recent referral activity
    const { data: recentSignups, error: signupsError } = await supabase
      .from('referral_signups')
      .select('new_user_email, referrer_bonus, created_at')
      .eq('referrer_user_id', userId)
      .eq('env', APP_ENV)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentActivity = signupsError ? [] : (recentSignups || [])

    console.log(`✅ Referral stats for ${userId}: ${referralData.total_invites} invites, ${actualTokensEarned} tokens earned`)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalInvites: referralData.total_invites || 0,
        tokensEarned: actualTokensEarned, // Use actual credits from ledger
        recentActivity,
        lastInviteAt: referralData.last_invite_at
      })
    }

  } catch (error) {
    console.error('❌ Get referral stats error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    }
  }
}
