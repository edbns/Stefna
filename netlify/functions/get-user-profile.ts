import type { Handler } from "@netlify/functions";
import { getDb } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json, mapPgError } from "./_lib/http";

export const handler: Handler = async (event) => {
  try {
    const { userId, email } = requireAuth(event.headers.authorization);
    const db = getDb();

    // Make sure user exists
    await db.query(
      "INSERT INTO users (id, email) VALUES ($1::uuid, $2) ON CONFLICT (id) DO NOTHING",
      [userId, email ?? null]
    );

    // Starter grant once
    const { rows: starterRows } = await db.query("SELECT (value::text)::int AS v FROM app_config WHERE key='starter_grant'");
    const STARTER = starterRows[0]?.v ?? 30;

    await db.query(
      `INSERT INTO user_credits(user_id, balance) VALUES ($1::uuid, $2::int)
       ON CONFLICT (user_id) DO NOTHING`, [userId, STARTER]
    );

    await db.query(
      `INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
       SELECT $1::uuid, gen_random_uuid(), 'grant', $2::int, 'granted', jsonb_build_object('reason','starter')
       WHERE NOT EXISTS (
         SELECT 1 FROM credits_ledger
         WHERE user_id=$1::uuid AND status='granted' AND meta->>'reason'='starter'
       )`, [userId, STARTER]
    );

    const [{ rows: bal }] = await Promise.all([
      db.query("SELECT balance FROM user_credits WHERE user_id=$1::uuid", [userId])
    ]);
    const { rows: capRows } = await db.query("SELECT (value::text)::int AS v FROM app_config WHERE key='daily_cap'");

    return json(200, {
      ok: true,
      user: { id: userId, email },
      daily_cap: capRows[0]?.v ?? 30,
      credits: { balance: bal[0]?.balance ?? 0 },
    });
  } catch (e) {
    return mapPgError(e);
  }
};

