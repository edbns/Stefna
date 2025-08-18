import type { Handler } from "@netlify/functions";
import { neon } from '@neondatabase/serverless';
import { requireAuth } from "./_auth";
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
    if (!event.headers?.authorization && !event.headers?.Authorization) {
      return json({ ok: false, error: 'NO_BEARER' }, { status: 401 });
    }
    const { sub: userId, email } = requireAuth(event.headers.authorization);
    console.log('[get-user-profile] User:', userId, 'Email:', email);
    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Make sure user exists
    await sql`
      INSERT INTO users (id, email, external_id) VALUES (${userId}, ${email ?? null}, ${userId}) 
      ON CONFLICT (id) DO NOTHING
    `;

    // Starter grant once
    const starterRows = await sql`
      SELECT (value::text)::int AS v FROM app_config WHERE key='starter_grant'
    `;
    const STARTER = starterRows[0]?.v ?? 30;

    await sql`
      INSERT INTO user_credits(user_id, balance) VALUES (${userId}, ${STARTER})
      ON CONFLICT (user_id) DO NOTHING
    `;

    await sql`
      INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
      SELECT ${userId}, gen_random_uuid(), 'grant', ${STARTER}, 'granted', jsonb_build_object('reason','starter')
      WHERE NOT EXISTS (
        SELECT 1 FROM credits_ledger
        WHERE user_id=${userId} AND status='granted' AND meta->>'reason'='starter'
      )
    `;

    const [bal] = await Promise.all([
      sql`SELECT balance FROM user_credits WHERE user_id=${userId}`
    ]);
    const capRows = await sql`SELECT (value::text)::int AS v FROM app_config WHERE key='daily_cap'`;

    return json({
      ok: true,
      user: { id: userId, email },
      daily_cap: capRows[0]?.v ?? 30,
      credits: { balance: bal[0]?.balance ?? 0 },
    });
  } catch (e: any) {
    const status = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    const code = e?.code || (status === 401 ? 'UNAUTHORIZED' : 'SERVER_ERROR');
    console.error('❌ get-user-profile failed:', e);
    console.error('❌ Error details:', {
      message: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : 'No stack trace',
      error: e
    });
    return json({ ok: false, error: code, details: e?.message || 'Unknown error' }, { status });
  }
}

