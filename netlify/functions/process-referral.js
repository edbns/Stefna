const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const { referrerEmail, newUserId, newUserEmail } = JSON.parse(event.body || '{}')
    
    if (!referrerEmail || !newUserId || !newUserEmail) {
      return { 
        statusCode: 400, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Referrer email, new user ID, and new user email required' }) 
      }
    }

    // Auto-detect environment
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod'
    console.log(`🎁 Processing referral in ${APP_ENV} env: ${referrerEmail} -> ${newUserEmail}`)

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Find the referrer by email
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', referrerEmail)
      .single()

    if (referrerError || !referrer) {
      console.log('❌ Invalid referrer email:', referrerEmail)
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid referrer email' })
      }
    }

    // 1b. Get or create referrer's referral stats
    let { data: referrerStats, error: statsError } = await supabase
      .from('user_referrals')
      .select('total_invites, total_tokens_earned')
      .eq('user_id', referrer.id)
      .single()

    if (statsError && statsError.code === 'PGRST116') {
      // Create referral stats if they don't exist
      const { data: newStats, error: createError } = await supabase
        .from('user_referrals')
        .insert({ user_id: referrer.id })
        .select('total_invites, total_tokens_earned')
        .single()
      
      if (createError) throw createError
      referrerStats = newStats
    } else if (statsError) {
      throw statsError
    }

    // 2. Check if this new user has already been referred
    const { data: existingReferral, error: existingError } = await supabase
      .from('referral_signups')
      .select('id')
      .eq('new_user_id', newUserId)
      .single()

    if (existingReferral) {
      console.log('❌ User already referred:', newUserId)
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User already referred' })
      }
    }

    // 3. Award credits to referrer (10 credits)
    const referrerBonus = 10
    const { error: referrerCreditError } = await supabase
      .from('credits_ledger')
      .insert({
        user_id: referrer.id,
        amount: referrerBonus,
        reason: `referral_bonus_${newUserEmail}`,
        request_id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        env: APP_ENV
      })

    if (referrerCreditError) {
      console.error('❌ Failed to award referrer credits:', referrerCreditError)
      throw referrerCreditError
    }

    // 4. Award credits to new user (5 credits)
    const newUserBonus = 5
    const { error: newUserCreditError } = await supabase
      .from('credits_ledger')
      .insert({
        user_id: newUserId,
        amount: newUserBonus,
        reason: `signup_bonus_${referrerEmail}`,
        request_id: `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        env: APP_ENV
      })

    if (newUserCreditError) {
      console.error('❌ Failed to award new user credits:', newUserCreditError)
      throw newUserCreditError
    }

    // 5. Record the referral signup
    const { error: signupError } = await supabase
      .from('referral_signups')
      .insert({
        referrer_user_id: referrer.id,
        referrer_email: referrerEmail,
        new_user_id: newUserId,
        new_user_email: newUserEmail,
        referrer_bonus: referrerBonus,
        new_user_bonus: newUserBonus,
        env: APP_ENV
      })

    if (signupError) {
      console.error('❌ Failed to record referral signup:', signupError)
      throw signupError
    }

    // 6. Update referrer's stats
    const { error: updateError } = await supabase
      .from('user_referrals')
      .update({
        total_invites: (referrerStats.total_invites || 0) + 1,
        total_tokens_earned: (referrerStats.total_tokens_earned || 0) + referrerBonus,
        last_invite_at: new Date().toISOString()
      })
      .eq('user_id', referrer.id)

    if (updateError) {
      console.error('❌ Failed to update referrer stats:', updateError)
      // Don't throw - credits were awarded successfully
    }

    console.log(`✅ Referral processed successfully: ${referrerEmail} (+${referrerBonus}) -> ${newUserEmail} (+${newUserBonus})`)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        referrerBonus,
        newUserBonus,
        totalAwarded: referrerBonus + newUserBonus
      })
    }

  } catch (error) {
    console.error('❌ Process referral error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    }
  }
}
