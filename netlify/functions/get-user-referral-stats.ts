import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId } = requireAuth(event.headers.authorization);
    
    console.log('📊 [User Referral Stats] Getting stats for user:', userId);

    // Get user's referral statistics from credits_ledger
    const referralStats = await qOne(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(amount) as total_credits_earned
      FROM credits_ledger 
      WHERE user_id = $1 AND reason = 'referral.referrer'
    `, [userId]);

    // Get user's email for referral code (using email as referral identifier)
    const user = await qOne(`
      SELECT email FROM users WHERE id = $1
    `, [userId]);

    const stats = {
      invites: referralStats?.total_referrals || 0,
      tokensEarned: referralStats?.total_credits_earned || 0,
      referralCode: user?.email || '', // Using email as referral identifier
      timestamp: new Date().toISOString()
    };

    console.log('✅ [User Referral Stats] Retrieved stats:', stats);
    
    return json({
      ok: true,
      stats
    });

  } catch (error) {
    console.error('❌ [User Referral Stats] Error:', error);
    return json({ 
      ok: false, 
      error: 'Failed to get referral stats',
      stats: {
        invites: 0,
        tokensEarned: 0,
        referralCode: '',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
};
