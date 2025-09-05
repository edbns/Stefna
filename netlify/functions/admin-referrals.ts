import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';

// ============================================================================
// ADMIN REFERRAL MANAGEMENT
// ============================================================================
// This function provides admin access to referral system management
// - View referral statistics
// - Manage referral rewards
// - View referral relationships
// - Configure referral system
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  try {
    // Admin authentication check
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (event.httpMethod === 'GET') {
      // Get referral statistics and data
      const { limit = '50', offset = '0', type = 'overview' } = event.queryStringParameters || {}
      
      // Ensure valid numbers
      const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 50));
      const offsetNum = Math.max(0, parseInt(offset) || 0);
      
      console.log('🔍 [Admin] Fetching referral data:', { type, limit: limitNum, offset: offsetNum })
      
      let referrals = []
      let statistics = {}

      if (type === 'overview') {
        // Get overall referral statistics
        statistics = await q(`
          SELECT 
            (SELECT COUNT(*) FROM users WHERE referral_code IS NOT NULL) as users_with_referral_code,
            (SELECT COUNT(*) FROM users WHERE referred_by IS NOT NULL) as users_referred,
            (SELECT COUNT(DISTINCT referred_by) FROM users WHERE referred_by IS NOT NULL) as unique_referrers,
            (SELECT COUNT(*) FROM users WHERE referral_credits_earned > 0) as users_earned_credits,
            (SELECT SUM(referral_credits_earned) FROM users) as total_credits_given,
            (SELECT AVG(referral_credits_earned) FROM users WHERE referral_credits_earned > 0) as avg_credits_per_user,
            (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days' AND referred_by IS NOT NULL) as new_referrals_7d,
            (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days' AND referred_by IS NOT NULL) as new_referrals_30d
        `)

        // Get top referrers
        referrals = await q(`
          SELECT 
            u.id,
            u.email,
            u.name,
            u.referral_code,
            COUNT(r.id) as total_referrals,
            SUM(r.referral_credits_earned) as total_credits_given,
            MAX(r.created_at) as last_referral_date
          FROM users u
          LEFT JOIN users r ON u.id = r.referred_by
          WHERE u.referral_code IS NOT NULL
          GROUP BY u.id, u.email, u.name, u.referral_code
          HAVING COUNT(r.id) > 0
          ORDER BY total_referrals DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum])

      } else if (type === 'relationships') {
        // Get detailed referral relationships
        referrals = await q(`
          SELECT 
            referrer.id as referrer_id,
            referrer.email as referrer_email,
            referrer.name as referrer_name,
            referrer.referral_code,
            referred.id as referred_id,
            referred.email as referred_email,
            referred.name as referred_name,
            referred.created_at as referred_date,
            referred.referral_credits_earned,
            referred.last_login
          FROM users referrer
          JOIN users referred ON referrer.id = referred.referred_by
          ORDER BY referred.created_at DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum])

        // Get relationship statistics
        statistics = await q(`
          SELECT 
            COUNT(*) as total_relationships,
            COUNT(CASE WHEN referred.last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_referrals_7d,
            COUNT(CASE WHEN referred.last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_referrals_30d,
            AVG(referred.referral_credits_earned) as avg_credits_per_referral
          FROM users referrer
          JOIN users referred ON referrer.id = referred.referred_by
        `)

      } else if (type === 'rewards') {
        // Get referral reward history
        referrals = await q(`
          SELECT 
            u.id,
            u.email,
            u.name,
            u.referral_credits_earned,
            u.referral_code,
            u.created_at as account_created,
            u.last_login,
            COUNT(r.id) as successful_referrals
          FROM users u
          LEFT JOIN users r ON u.id = r.referred_by
          WHERE u.referral_credits_earned > 0
          GROUP BY u.id, u.email, u.name, u.referral_credits_earned, u.referral_code, u.created_at, u.last_login
          ORDER BY u.referral_credits_earned DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum])

        // Get reward statistics
        statistics = await q(`
          SELECT 
            SUM(referral_credits_earned) as total_credits_distributed,
            COUNT(CASE WHEN referral_credits_earned > 0 THEN 1 END) as users_rewarded,
            AVG(referral_credits_earned) as avg_credits_per_user,
            MAX(referral_credits_earned) as max_credits_earned,
            COUNT(CASE WHEN referral_credits_earned >= 10 THEN 1 END) as users_with_10_plus_credits
          FROM users
          WHERE referral_credits_earned > 0
        `)
      }

      // Get total count for pagination
      let totalCount = 0
      if (type === 'overview') {
        const countResult = await q(`
          SELECT COUNT(*) as total FROM (
            SELECT u.id FROM users u
            LEFT JOIN users r ON u.id = r.referred_by
            WHERE u.referral_code IS NOT NULL
            GROUP BY u.id
            HAVING COUNT(r.id) > 0
          ) top_referrers
        `)
        totalCount = countResult[0]?.total || 0
      } else if (type === 'relationships') {
        const countResult = await q(`
          SELECT COUNT(*) as total FROM users referrer
          JOIN users referred ON referrer.id = referred.referred_by
        `)
        totalCount = countResult[0]?.total || 0
      } else if (type === 'rewards') {
        const countResult = await q(`
          SELECT COUNT(*) as total FROM users WHERE referral_credits_earned > 0
        `)
        totalCount = countResult[0]?.total || 0
      }

      console.log(`✅ [Admin] Retrieved ${referrals.length} referral entries`)
      
      return json({
        referrals,
        statistics: Array.isArray(statistics) ? statistics[0] || {} : statistics,
        total: totalCount,
        type,
        limit: limitNum,
        offset: offsetNum,
        timestamp: new Date().toISOString()
      })

    } else if (event.httpMethod === 'PUT') {
      // Update referral configuration
      const body = JSON.parse(event.body || '{}')
      const { action, data } = body

      if (!action) {
        return json({ error: 'Action is required' }, { status: 400 })
      }

      console.log(`⚙️ [Admin] Referral action: ${action}`)

      switch (action) {
        case 'adjust_referral_credits':
          // Adjust referral credits for a user
          const { userId, credits } = data
          if (!userId || credits === undefined) {
            return json({ error: 'User ID and credits are required' }, { status: 400 })
          }

          const updateResult = await q(`
            UPDATE users 
            SET referral_credits_earned = $1
            WHERE id = $2
          `, [credits, userId])

          console.log(`✅ [Admin] Adjusted referral credits for user ${userId}`)
          return json({
            success: true,
            message: 'Referral credits adjusted successfully'
          })

        case 'reset_referral_stats':
          // Reset referral statistics
          const resetResult = await q(`
            UPDATE users 
            SET referral_credits_earned = 0
            WHERE referral_credits_earned > 0
          `)

          console.log(`✅ [Admin] Reset all referral credits`)
          return json({
            success: true,
            message: 'Referral statistics reset successfully'
          })

        default:
          return json({ error: 'Invalid action' }, { status: 400 })
      }

    } else {
      return json({ error: 'Method not allowed' }, { status: 405 })
    }

  } catch (error: any) {
    console.error('💥 [Admin Referrals] Error:', error?.message || error)
    return json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}
