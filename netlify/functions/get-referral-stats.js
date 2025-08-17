const { neon } = require('@neondatabase/serverless');
const { withAuth } = require('./_withAuth');

exports.handler = withAuth(async (_event, user) => {
  const userId = user.sub;
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    // Get referral stats from database
    let referrerStats = { total_invites: 0, total_tokens_earned: 0 };
    
    try {
      const statsResult = await sql`
        SELECT total_invites, total_tokens_earned
        FROM user_referrals 
        WHERE user_id = ${userId}
        LIMIT 1
      `;
      
      if (statsResult && statsResult.length > 0) {
        referrerStats = statsResult[0];
      }
    } catch (statsError) {
      console.log('⚠️ Referral stats table may not exist, using defaults:', statsError.message);
    }

    // Get total credits earned from credits_ledger
    let totalCreditsEarned = 0;
    try {
      const creditsResult = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_earned
        FROM credits_ledger 
        WHERE user_id = ${userId} 
          AND amount > 0 
          AND reason LIKE 'referral_bonus_%'
      `;
      
      if (creditsResult && creditsResult.length > 0) {
        totalCreditsEarned = creditsResult[0].total_earned || 0;
      }
    } catch (creditsError) {
      console.log('⚠️ Credits ledger table may not exist, using defaults:', creditsError.message);
    }

    // Generate referral code if none exists
    const referralCode = `REF_${userId.slice(-6)}_${Date.now().toString(36)}`;

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        ok: true,
        invites: referrerStats.total_invites || 0,
        tokensEarned: totalCreditsEarned,
        referralCode: referralCode
      })
    };

  } catch (error) {
    console.error('❌ Get referral stats error:', error);
    
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        ok: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get referral stats'
      })
    };
  }
});
