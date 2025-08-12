const { verifyAuth } = require('./_auth')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: '' }
    }
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Method Not Allowed' }
    }

    const { userId } = verifyAuth(event)

    // Validate UUID; if not a UUID (e.g., custom/legacy id), return safe defaults
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    if (!isUuid(userId)) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 })
      }
    }

    // Auto-detect environment to match aimlApi
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod';
    console.log(`🌍 getQuota using env: ${APP_ENV} for user: ${userId}`);

    const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    // Calculate start of today in UTC
    const startUTC = new Date();
    startUTC.setUTCHours(0, 0, 0, 0);
    
    // Get today's credit usage from credits_ledger
    const { data: creditRows, error: creditError } = await supa
      .from('credits_ledger')
      .select('amount')
      .eq('user_id', userId)
      .eq('env', APP_ENV)
      .gte('created_at', startUTC.toISOString());

    if (creditError) {
      console.error('getQuota credits_ledger error:', creditError);
      // Fallback to safe defaults
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 })
      }
    }

    // Calculate used credits for today
    const daily_used = (creditRows || []).reduce((sum, row) => sum + (row.amount || 0), 0);
    
    // For now, use hardcoded limits (you can make this dynamic later)
    const daily_limit = 50; // Default daily limit
    const weekly_limit = 250; // Default weekly limit
    
    // Calculate weekly usage (last 7 days)
    const weekAgo = new Date();
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
    
    const { data: weeklyRows, error: weeklyError } = await supa
      .from('credits_ledger')
      .select('amount')
      .eq('user_id', userId)
      .eq('env', APP_ENV)
      .gte('created_at', weekAgo.toISOString());

    const weekly_used = weeklyError ? 0 : (weeklyRows || []).reduce((sum, row) => sum + (row.amount || 0), 0);

    console.log(`📊 Quota for user ${userId} (${APP_ENV}): daily ${daily_used}/${daily_limit}, weekly ${weekly_used}/${weekly_limit}`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daily_used,
        daily_limit,
        weekly_used,
        weekly_limit,
        remaining: Math.max(0, daily_limit - daily_used)
      })
    }
  } catch (e) {
    // Fallback to safe defaults instead of hard 500s
    const status = e && e.message === 'no_bearer' ? 401 : 200
    const body = status === 200
      ? { daily_used: 0, daily_limit: 30, weekly_used: 0, weekly_limit: 150 }
      : { error: e.message || 'Unauthorized' }
    return { statusCode: status, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  }
}


