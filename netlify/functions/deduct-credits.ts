import type { Handler } from "@netlify/functions";
import { getDb } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json, mapPgError } from "./_lib/http";
import { randomUUID } from "crypto";

export const handler: Handler = async (event) => {
  try {
    console.log('💰 Credits deduction request:', {
      hasAuth: !!event.headers.authorization,
      authHeader: event.headers.authorization?.substring(0, 20) + '...',
      body: event.body,
      method: event.method
    });
    
    const { userId } = requireAuth(event.headers.authorization);
    const body = event.body ? JSON.parse(event.body) : {};
    const cost = body.cost || 2; // Default to 2 credits for images
    const action = body.action || "image.gen";
    const request_id = body.request_id || randomUUID();

    console.log('💰 Credits deduction params:', {
      userId,
      cost,
      action,
      request_id
    });

    const db = getDb();
    console.log('💰 Database connection obtained:', !!db);
    
    // Test database connection
    try {
      const { rows: testRows } = await db.query('SELECT NOW() as current_time');
      console.log('💰 Database connection test successful:', testRows[0]);
    } catch (dbTestError) {
      console.error('💰 Database connection test failed:', dbTestError);
      return json(500, { ok: false, error: 'Database connection failed', details: dbTestError?.message });
    }

    // Check daily cap
    console.log('💰 Checking daily cap for user:', userId, 'cost:', cost);
    try {
      const { rows: capOk } = await db.query("SELECT app.allow_today_simple($1::uuid,$2::int) AS allowed", [userId, cost]);
      console.log('💰 Daily cap check result:', capOk[0]);
      if (!capOk[0]?.allowed) return json(429, { ok:false, error:"DAILY_CAP_REACHED" });
    } catch (capError) {
      console.error('💰 Daily cap check failed:', capError);
      return json(500, { ok: false, error: 'Daily cap check failed', details: capError?.message });
    }

    // Reserve credits
    console.log('💰 Reserving credits for user:', userId, 'request:', request_id, 'action:', action, 'cost:', cost);
    try {
      const { rows } = await db.query(
        "SELECT * FROM app.reserve_credits($1::uuid,$2::uuid,$3::text,$4::int)",
        [userId, request_id, action, cost]
      );
      console.log('💰 Credits reserved successfully:', rows[0]);
    } catch (reserveError) {
      console.error('💰 Credits reservation failed:', reserveError);
      return json(500, { ok: false, error: 'Credits reservation failed', details: reserveError?.message });
    }

    return json(200, { 
      ok: true, 
      request_id, 
      action, 
      cost, 
      balance: rows[0]?.balance ?? null,
      message: "Credits reserved. Call credits-finalize to commit or refund."
    });
  } catch (e) {
    console.error('💰 Credits deduction error:', {
      error: e,
      message: e?.message,
      stack: e?.stack,
      name: e?.name
    });
    return mapPgError(e);
  }
};
