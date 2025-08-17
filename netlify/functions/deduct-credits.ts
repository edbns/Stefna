import type { Handler } from "@netlify/functions";
import { getDb, getAppConfig } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json, mapPgError } from "./_lib/http";
import { randomUUID } from "crypto";

export const handler: Handler = async (event) => {
  // 🔧 Top-level try/catch as recommended by third party to catch ALL errors
  try {
    // 🔐 Defensive logging as recommended by third party
    console.log("🔐 Incoming request:", {
      headers: event.headers,
      body: event.body,
      method: event.httpMethod,
      hasAuth: !!event.headers.authorization,
      authHeader: event.headers.authorization?.substring(0, 20) + '...'
    });
    
    const { userId } = requireAuth(event.headers.authorization);
    console.log("👤 userId resolved:", userId);
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("📦 Request body parsed:", body);
    
    // 🔧 Get dynamic configuration from app_config with proper validation
    let config;
    try {
      config = await getAppConfig(['image_cost', 'daily_cap']);
      console.log('💰 App config loaded:', config);
      
      // Validate config values as recommended by third party
      if (!config.image_cost || isNaN(parseInt(config.image_cost))) {
        console.error('❌ Invalid image_cost config:', config.image_cost);
        config.image_cost = 2; // Fallback to default
      }
      
      if (!config.daily_cap || isNaN(parseInt(config.daily_cap))) {
        console.error('❌ Invalid daily_cap config:', config.daily_cap);
        config.daily_cap = 30; // Fallback to default
      }
      
    } catch (configError) {
      console.error('💰 Failed to load app config:', configError);
      // Fallback to defaults if config fails
      config = { image_cost: 2, daily_cap: 30 };
    }
    
    const cost = body.cost || body.amount || parseInt(config.image_cost) || 2; // Dynamic cost with fallback
    const action = body.action || body.intent || "image.gen"; // Support both action and intent
    const request_id = body.request_id || body.requestId || randomUUID(); // Support both formats

    console.log('💰 Credits deduction params:', {
      userId,
      cost,
      action,
      request_id,
      config: { image_cost: config.image_cost, daily_cap: config.daily_cap }
    });

    // 🛡️ Validation as recommended by third party
    if (!userId) {
      console.error("❌ userId is missing or undefined");
      return json(400, { ok: false, error: 'Missing or invalid userId' });
    }
    
    if (!cost || cost <= 0 || isNaN(cost)) {
      console.error("❌ Invalid cost:", cost);
      return json(400, { ok: false, error: `Invalid cost: ${cost} - must be a number greater than 0` });
    }
    
    if (!action) {
      console.error("❌ Missing action/intent");
      return json(400, { ok: false, error: 'Missing action or intent' });
    }

    const db = getDb();
    console.log('💰 Database connection obtained:', !!db);
    
    // 🗄️ Comprehensive DB logic with try/catch as recommended by third party
    let rows: any[] = [];
    try {
      // Test database connection
      const { rows: testRows } = await db.query('SELECT NOW() as current_time');
      console.log('💰 Database connection test successful:', testRows[0]);
      
      // Check daily cap (using dynamic config)
      console.log('💰 Checking daily cap for user:', userId, 'cost:', cost, 'daily_cap:', config.daily_cap);
      const { rows: capOk } = await db.query("SELECT app.allow_today_simple($1::uuid,$2::int) AS allowed", [userId, cost]);
      console.log('💰 Daily cap check result:', capOk[0]);
      if (!capOk[0]?.allowed) return json(429, { ok:false, error:"DAILY_CAP_REACHED" });
      
      // Reserve credits with defensive logging as recommended by third party
      console.log('💰 reserve_credits inputs:', {
        userId,
        request_id,
        action,
        cost,
        userIdType: typeof userId,
        requestIdType: typeof request_id,
        actionType: typeof action,
        costType: typeof cost
      });
      
      try {
        const result = await db.query(
          "SELECT * FROM app.reserve_credits($1::uuid,$2::uuid,$3::text,$4::int)",
          [userId, request_id, action, cost]
        );
        rows = result.rows;
        console.log('💰 Credits reserved successfully:', rows[0]);
      } catch (dbError) {
        console.error("❌ reserve_credits() call failed:", dbError);
        return json(500, {
          ok: false,
          error: "DB_RESERVE_CREDITS_FAILED",
          message: dbError?.message,
          stack: dbError?.stack,
        });
      }
      
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
    
  } catch (error) {
    // 🔧 Top-level error logging as recommended by third party
    console.error("❌ deduct-credits failed:", error);
    return json(500, { 
      ok: false, 
      error: "Credits deduction failed",
      details: error?.message || 'Unknown error'
    });
  }
};
