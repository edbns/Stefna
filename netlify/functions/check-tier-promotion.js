const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const { userId } = verifyAuth(event)
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log(`🔍 Checking tier promotion for user: ${userId}`)

    // Check if user was recently promoted
    const { data: recentPromotion, error: promotionError } = await supabase
      .from('user_promotions')
      .select('*')
      .eq('user_id', userId)
      .order('promoted_at', { ascending: false })
      .limit(1)
      .single()

    if (promotionError && promotionError.code !== 'PGRST116') {
      console.error('❌ Error checking promotions:', promotionError)
      return { statusCode: 500, body: JSON.stringify({ error: promotionError.message }) }
    }

    // If user was promoted in the last hour, send notification
    if (recentPromotion) {
      const promotionTime = new Date(recentPromotion.promoted_at)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      if (promotionTime > oneHourAgo) {
        console.log(`🎉 User ${userId} was recently promoted to ${recentPromotion.new_tier}`)
        
        return {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            promoted: true,
            newTier: recentPromotion.new_tier,
            oldTier: recentPromotion.old_tier,
            message: recentPromotion.new_tier === 'verified' 
              ? 'Congratulations! You\'ve been promoted to Verified Creator! 🎉'
              : 'Amazing! You\'ve reached Contributor status! 🌟',
            promotedAt: recentPromotion.promoted_at
          })
        }
      }
    }

    // No recent promotion
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        promoted: false,
        message: 'No recent promotion'
      })
    }

  } catch (e) {
    console.error('❌ Check tier promotion error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Internal server error' }) 
    }
  }
}

