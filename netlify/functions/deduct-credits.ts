import type { Handler } from "@netlify/functions";
import { getDb } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json, mapPgError } from "./_lib/http";
import { randomUUID } from "crypto";

export const handler: Handler = async (event) => {
  try {
    // 🔐 Defensive logging as recommended by third party
    console.log("🔐 Incoming request:", {
      headers: event.headers,
      body: event.body,
      method: event.method,
      hasAuth: !!event.headers.authorization,
      authHeader: event.headers.authorization?.substring(0, 20) + '...'
    });
    
    const { userId } = requireAuth(event.headers.authorization);
    console.log("👤 userId resolved:", userId);
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("📦 Request body parsed:", body);
    
    const cost = body.cost || body.amount || 2; // Support both cost and amount
    const action = body.action || body.intent || "image.gen"; // Support both action and intent
    const request_id = body.request_id || body.requestId || randomUUID(); // Support both formats

    console.log('💰 Credits deduction params:', {
      userId,
      cost,
      action,
      request_id
    });

    // 🛡️ Validation as recommended by third party
    if (!userId) {
      console.error("❌ userId is missing or undefined");
      return json(400, { ok: false, error: 'Missing or invalid userId' });
    }
    
    if (!cost || cost <= 0) {
      console.error("❌ Invalid cost:", cost);
      return json(400, { ok: false, error: 'Invalid cost - must be greater than 0' });
    }
    
    if (!action) {
      console.error("❌ Missing action/intent");
      return json(400, { ok: false, error: 'Missing action or intent' });
    }

    const db = getDb();
    console.log('💰 Database connection obtained:', !!db);
    
    // 🗄️ Comprehensive DB logic with try/catch as recommended by third party
    try {
      // Test database connection
      const { rows: testRows } = await db.query('SELECT NOW() as current_time');
      console.log('💰 Database connection test successful:', testRows[0]);
      
      // Check daily cap
      console.log('💰 Checking daily cap for user:', userId, 'cost:', cost);
      const { rows: capOk } = await db.query("SELECT app.allow_today_simple($1::uuid,$2::int) AS allowed", [userId, cost]);
      console.log('💰 Daily cap check result:', capOk[0]);
      if (!capOk[0]?.allowed) return json(429, { ok:false, error:"DAILY_CAP_REACHED" });
      
      // Reserve credits
      console.log('💰 Reserving credits for user:', userId, 'request:', request_id, 'action:', action, 'cost:', cost);
      const { rows } = await db.query(
        "SELECT * FROM app.reserve_credits($1::uuid,$2::uuid,$3::text,$4::int)",
        [userId, request_id, action, cost]
      );
      console.log('💰 Credits reserved successfully:', rows[0]);
      
    } catch (dbError) {
      console.error("💥 DB deduction failed:", dbError);
      return json(500, { 
        ok: false, 
        error: "Failed to deduct credits", 
        details: dbError?.message,
        stack: dbError?.stack 
      });
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
