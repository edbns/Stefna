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
        // Get overall referral statistics (email-based system)
        statistics = await q(`
          SELECT 
            (SELECT COUNT(DISTINCT user_id) FROM credits_ledger WHERE reason = 'referral.referrer') as users_referred,
            (SELECT COUNT(DISTINCT user_id) FROM credits_ledger WHERE reason = 'referral.referrer') as unique_referrers,
            (SELECT COUNT(DISTINCT user_id) FROM credits_ledger WHERE reason = 'referral.referrer') as users_earned_credits,
            (SELECT SUM(amount) FROM credits_ledger WHERE reason = 'referral.referrer') as total_credits_given,
            (SELECT AVG(amount) FROM credits_ledger WHERE reason = 'referral.referrer') as avg_credits_per_user,
            (SELECT COUNT(*) FROM credits_ledger WHERE reason = 'referral.referrer' AND created_at >= NOW() - INTERVAL '7 days') as new_referrals_7d,
            (SELECT COUNT(*) FROM credits_ledger WHERE reason = 'referral.referrer' AND created_at >= NOW() - INTERVAL '30 days') as new_referrals_30d
        `)

        // Get top referrers (email-based system)
        referrals = await q(`
          SELECT 
            u.id,
            u.email,
            u.name,
            COUNT(cl.id) as total_referrals,
            SUM(cl.amount) as total_credits_given,
            MAX(cl.created_at) as last_referral_date
          FROM users u
          JOIN credits_ledger cl ON u.id = cl.user_id
          WHERE cl.reason = 'referral.referrer'
          GROUP BY u.id, u.email, u.name
          ORDER BY total_referrals DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum])

      } else if (type === 'relationships') {
        // Get detailed referral relationships (email-based system)
        referrals = await q(`
          SELECT 
            referrer.id as referrer_id,
            referrer.email as referrer_email,
            referrer.name as referrer_name,
            referred.id as referred_id,
            referred.email as referred_email,
            referred.name as referred_name,
            cl.created_at as referred_date,
            cl.amount as referral_credits_earned,
            referred.last_login
          FROM credits_ledger cl
          JOIN users referrer ON cl.user_id = referrer.id
          JOIN users referred ON cl.details->>'referred_user' = referred.id::text
          WHERE cl.reason = 'referral.referrer'
          ORDER BY cl.created_at DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum])

        // Get relationship statistics
        statistics = await q(`
          SELECT 
            COUNT(*) as total_relationships,
            COUNT(CASE WHEN referred.last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_referrals_7d,
            COUNT(CASE WHEN referred.last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_referrals_30d,
            AVG(cl.amount) as avg_credits_per_referral
          FROM credits_ledger cl
          JOIN users referrer ON cl.user_id = referrer.id
          JOIN users referred ON cl.details->>'referred_user' = referred.id::text
          WHERE cl.reason = 'referral.referrer'
        `)

      } else if (type === 'rewards') {
        // Get referral reward history (email-based system)
        referrals = await q(`
          SELECT 
            u.id,
            u.email,
            u.name,
            SUM(cl.amount) as referral_credits_earned,
            u.created_at as account_created,
            u.last_login,
            COUNT(cl.id) as successful_referrals
          FROM users u
          JOIN credits_ledger cl ON u.id = cl.user_id
          WHERE cl.reason = 'referral.referrer'
          GROUP BY u.id, u.email, u.name, u.created_at, u.last_login
          ORDER BY referral_credits_earned DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum])

        // Get reward statistics
        statistics = await q(`
          SELECT 
            SUM(amount) as total_credits_distributed,
            COUNT(DISTINCT user_id) as users_rewarded,
            AVG(amount) as avg_credits_per_user,
            MAX(amount) as max_credits_earned,
            COUNT(CASE WHEN amount >= 10 THEN 1 END) as users_with_10_plus_credits
          FROM credits_ledger
          WHERE reason = 'referral.referrer'
        `)
      }

      // Get total count for pagination
      let totalCount = 0
      if (type === 'overview') {
        const countResult = await q(`
          SELECT COUNT(DISTINCT user_id) as total FROM credits_ledger WHERE reason = 'referral.referrer'
        `)
        totalCount = countResult[0]?.total || 0
      } else if (type === 'relationships') {
        const countResult = await q(`
          SELECT COUNT(*) as total FROM credits_ledger WHERE reason = 'referral.referrer'
        `)
        totalCount = countResult[0]?.total || 0
      } else if (type === 'rewards') {
        const countResult = await q(`
          SELECT COUNT(DISTINCT user_id) as total FROM credits_ledger WHERE reason = 'referral.referrer'
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
          // Adjust referral credits for a user (email-based system)
          const { userId, credits } = data
          if (!userId || credits === undefined) {
            return json({ error: 'User ID and credits are required' }, { status: 400 })
          }

          // Update credits_ledger instead of users table
          const updateResult = await q(`
            UPDATE credits_ledger 
            SET amount = $1
            WHERE user_id = $2 AND reason = 'referral.referrer'
          `, [credits, userId])

          console.log(`✅ [Admin] Adjusted referral credits for user ${userId}`)
          return json({
            success: true,
            message: 'Referral credits adjusted successfully'
          })

        case 'reset_referral_stats':
          // Reset referral statistics (email-based system)
          const resetResult = await q(`
            DELETE FROM credits_ledger 
            WHERE reason = 'referral.referrer'
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
