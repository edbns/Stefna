import type { Handler } from "@netlify/functions";
import { neon } from '@neondatabase/serverless';
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    const { userId } = requireAuth(event.headers.authorization);
    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Simple referral stats - return safe defaults if tables don't exist
    try {
      const [signups, grants] = await Promise.all([
        sql`SELECT count(*)::int AS count FROM referral_signups WHERE referrer_user_id = ${userId}`,
        sql`SELECT coalesce(SUM(amount),0)::int AS granted FROM credits_ledger WHERE user_id = ${userId} AND status = 'granted' AND action = 'referral.referrer'`
      ]);

      return json({
        ok: true,
        invites: signups[0]?.count ?? 0,
        tokensEarned: grants[0]?.granted ?? 0,
        referralCode: `REF_${userId.slice(-6)}`
      });
    } catch (dbError) {
      console.error('❌ Database error in get-referral-stats:', dbError);
      // Return safe defaults if database fails
      return json({
        ok: true,
        invites: 0,
        tokensEarned: 0,
        referralCode: `REF_${userId.slice(-6)}`
      });
    }
  } catch (e: any) {
    console.error('❌ get-referral-stats failed:', e);
    return json({
      ok: false,
      error: 'REFERRAL_STATS_ERROR',
      invites: 0,
      tokensEarned: 0,
      referralCode: 'REF_ERROR'
    });
  }
};
