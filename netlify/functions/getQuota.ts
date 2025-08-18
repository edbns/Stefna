import type { Handler } from "@netlify/functions";
import { requireAuth } from './_lib/auth';
import { neon } from '@neondatabase/serverless';
import { json } from './_lib/http';

// ---- Database connection ----
const sql = neon(process.env.NETLIFY_DATABASE_URL!);

export const handler: Handler = async (event) => {
  try {
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
    if (event.httpMethod !== 'GET') {
      return json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    const { userId } = requireAuth(event.headers.authorization)

    // Validate UUID; if not a UUID (e.g., custom/legacy id), return safe defaults
    const isUuid = (v: string) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    if (!isUuid(userId)) {
      return json({ daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 })
    }

    // Auto-detect environment to match aimlApi
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod';
    console.log(`🌍 getQuota using env: ${APP_ENV} for user: ${userId}`);

    try {
      // Calculate start of today in UTC
      const startUTC = new Date();
      startUTC.setUTCHours(0, 0, 0, 0);
      
      // Get today's credit usage from credits_ledger
      // Only count negative amounts (spending), not positive amounts (grants)
      const creditRows = await sql`
        SELECT amount
        FROM credits_ledger
        WHERE user_id = ${userId}
          AND created_at >= ${startUTC.toISOString()}
          AND amount < 0
      `;

      // Calculate used credits for today (only negative amounts)
      const daily_used = Math.abs((creditRows || []).reduce((sum: number, row: any) => sum + (row.amount || 0), 0));
      
      // For now, use hardcoded limits (you can make this dynamic later)
      const daily_limit = 30; // Default daily limit (matches starter grant)
      const weekly_limit = 210; // Default weekly limit (7 * 30)
      
      // Calculate weekly usage (last 7 days)
      const weekAgo = new Date();
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      
      const weeklyRows = await sql`
        SELECT amount
        FROM credits_ledger
        WHERE user_id = ${userId}
          AND created_at >= ${weekAgo.toISOString()}
          AND amount < 0
      `;

      const weekly_used = Math.abs((weeklyRows || []).reduce((sum: number, row: any) => sum + (row.amount || 0), 0));

      console.log(`📊 Quota for user ${userId} (${APP_ENV}): daily ${daily_used}/${daily_limit}, weekly ${weekly_used}/${weekly_limit}`);

      return json({
        daily_used,
        daily_limit,
        weekly_used,
        weekly_limit,
        remaining: Math.max(0, daily_limit - daily_used)
      })
    } catch (dbError) {
      console.error('getQuota database error:', dbError);
      // Fallback to safe defaults
      return json({ daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 })
    }
  } catch (e: any) {
    // Fallback to safe defaults instead of hard 500s
    const status = e && e.message === 'no_bearer' ? 401 : 200;
    const body = status === 200
      ? { daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 }
      : { error: e.message || 'Unauthorized' };
    return status === 200 ? json(body) : json(body, { status });
  }
}
