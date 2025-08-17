import type { Handler } from "@netlify/functions";
import { getDb, getAppConfig } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";
import { randomUUID } from "crypto";

export const handler: Handler = async (event) => {
  console.log('💰 [credits-reserve] Starting credits reservation...');
  console.log('💰 [credits-reserve] event.body:', event.body);
  console.log('💰 [credits-reserve] event.headers:', event.headers);
  
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, { ok: false, error: 'Method not allowed' });
    }

    const { userId } = requireAuth(event.headers.authorization);
    console.log("👤 userId resolved:", userId);
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("📦 Request body parsed:", body);
    
    // Get dynamic configuration from app_config
    let config;
    try {
      config = await getAppConfig(['image_cost', 'daily_cap']);
      console.log('💰 App config loaded:', config);
      
      // Validate config values
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
      config = { image_cost: 2, daily_cap: 30 };
    }
    
    const cost = body.cost || body.amount || parseInt(config.image_cost) || 2;
    const action = body.action || body.intent || "image.gen";
    const request_id = body.request_id || body.requestId || randomUUID();

    console.log("💰 [credits-reserve] Parsed:", { userId, request_id, action, cost });
    console.log('💰 Credits reservation params:', {
      userId,
      cost,
      action,
      request_id,
      config: { image_cost: config.image_cost, daily_cap: config.daily_cap }
    });
    
    // 🔍 Debug: Log the exact action value and type
    console.log('🔍 Action debug:', {
      action,
      actionType: typeof action,
      actionLength: action?.length,
      actionTrimmed: action?.trim?.(),
      actionLower: action?.toLowerCase?.(),
      isValidAction: allowedActions.includes(action)
    });

    // Validation
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
    
    // Validate action values
    const allowedActions = ['image.gen', 'video.gen', 'mask.gen', 'emotionmask', 'preset', 'presets', 'moodmorph', 'custom'];
    if (!allowedActions.includes(action)) {
      console.error("❌ Invalid action:", action, "Allowed:", allowedActions);
      return json(400, { ok: false, error: `Invalid action: ${action}. Allowed: ${allowedActions.join(', ')}` });
    }

    const db = getDb();
    console.log('💰 Database connection obtained:', !!db);
    
    let rows: any[] = [];
    try {
      // Test database connection
      const { rows: testRows } = await db.query('SELECT NOW() as current_time');
      console.log('💰 Database connection test successful:', testRows[0]);
      
      // Check if app.reserve_credits function exists
      try {
        const { rows: funcCheck } = await db.query(`
          SELECT 
            n.nspname AS schema,
            p.proname AS function,
            pg_catalog.pg_get_function_arguments(p.oid) AS args
          FROM pg_catalog.pg_proc p
          JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          WHERE p.proname = 'reserve_credits' AND n.nspname = 'app'
        `);
        console.log('💰 Function check result:', funcCheck[0]);
        
        if (!funcCheck[0]) {
          console.error('❌ app.reserve_credits function not found!');
          return json(500, { 
            ok: false, 
            error: "DB_FUNCTION_MISSING",
            message: "app.reserve_credits function not found in database"
          });
        }
      } catch (funcError) {
        console.error('❌ Function check failed:', funcError);
        return json(500, { 
          ok: false, 
          error: "DB_FUNCTION_CHECK_FAILED",
          message: funcError?.message
        });
      }
      
      // Check daily cap
      console.log('💰 Checking daily cap for user:', userId, 'cost:', cost, 'daily_cap:', config.daily_cap);
      const { rows: capOk } = await db.query("SELECT app.allow_today_simple($1::uuid,$2::int) AS allowed", [userId, cost]);
      console.log('💰 Daily cap check result:', capOk[0]);
      if (!capOk[0]?.allowed) {
        return json(429, { ok: false, error: "DAILY_CAP_REACHED" });
      }
      
      // Reserve credits using the new system
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
      
      const sqlQuery = "SELECT * FROM app.reserve_credits($1::uuid, $2::uuid, $3::text, $4::int)";
      const params = [userId, request_id, action, cost];
      console.log('💰 SQL Query:', sqlQuery);
      console.log('💰 Parameters:', params);
      console.log('💰 Expected return: TABLE (balance int)');
      
      try {
        const result = await db.query(sqlQuery, params);
        rows = result.rows;
        console.log('💰 Credits reserved successfully:', rows[0]);
        
        // Validate the return structure matches our SQL function
        if (!rows[0] || typeof rows[0].balance !== 'number') {
          console.error('❌ Unexpected return structure:', rows[0]);
          return json(500, {
            ok: false,
            error: "DB_UNEXPECTED_RETURN_STRUCTURE",
            message: `Expected {balance: number}, got: ${JSON.stringify(rows[0])}`,
          });
        }
        
        console.log('💰 Balance after reservation:', rows[0].balance);
        
        // Return success with request_id for finalization
        return json(200, {
          ok: true,
          request_id: request_id,
          balance: rows[0].balance,
          cost: cost,
          action: action
        });
        
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
      console.error("💥 DB reservation failed:", dbError);
      return json(500, { 
        ok: false, 
        error: "Failed to reserve credits", 
        details: dbError?.message,
        stack: dbError?.stack 
      });
    }
    
  } catch (error) {
    console.error("💥 Top-level error in credits-reserve:", error);
    return json(500, {
      ok: false,
      error: "Internal server error",
      details: error?.message,
      stack: error?.stack
    });
  }
};
