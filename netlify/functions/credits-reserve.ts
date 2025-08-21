import type { Handler } from "@netlify/functions";
import { neon } from '@neondatabase/serverless';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";
import { randomUUID } from "crypto";

export const handler: Handler = async (event) => {
  // Force redeploy - v2
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

  console.log('[credits-reserve] Starting credits reservation...');
  console.log('[credits-reserve] Method:', event.httpMethod);
  console.log('[credits-reserve] Headers:', event.headers);
  
  try {
    if (event.httpMethod !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    const { userId } = requireAuth(event.headers.authorization);
    console.log("[credits-reserve] User:", userId);
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("📦 Request body parsed:", body);
    console.log("🔍 reserve_credits payload:", { 
      user_id: body.userId || body.user_id, 
      mode: body.action || body.mode, 
      asset_id: body.assetId || body.asset_id,
      cost: body.cost,
      request_id: body.request_id || body.requestId
    });
    
    // Get dynamic configuration from app_config
    let config;
    try {
      const sql = neon(process.env.NETLIFY_DATABASE_URL!);
      // Read values individually to avoid array/IN binding issues
      const imageCostRows = await sql`SELECT (value::text)::int AS v FROM app_config WHERE key='image_cost'`;
      const dailyCapRows  = await sql`SELECT (value::text)::int AS v FROM app_config WHERE key='daily_cap'`;

      const image_cost = imageCostRows?.[0]?.v;
      const daily_cap  = dailyCapRows?.[0]?.v;

      config = {
        image_cost: typeof image_cost === 'number' && !Number.isNaN(image_cost) ? image_cost : 2,
        daily_cap: typeof daily_cap === 'number' && !Number.isNaN(daily_cap) ? daily_cap : 30,
      };
      console.log('💰 App config resolved:', config);
    } catch (configError) {
      console.error('💰 Failed to load app config, using defaults:', configError);
      config = { image_cost: 2, daily_cap: 30 };
    }
    
    const cost = body.cost || body.amount || parseInt(config.image_cost) || 2;
    const action = body.action || body.intent || "image.gen";
    const request_id = body.request_id || body.requestId || randomUUID();

    console.log("[credits-reserve] Parsed:", { userId, request_id, action, cost });
    console.log('[credits-reserve] Credits reservation params:', {
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
      isValidAction: false // Will validate after allowedActions is declared
    });

    // Validation
    if (!userId) {
      console.error("❌ userId is missing or undefined");
      return json({ ok: false, error: 'Missing or invalid userId' }, { status: 400 });
    }
    
    if (!cost || cost <= 0 || isNaN(cost)) {
      console.error("❌ Invalid cost:", cost);
      return json({ ok: false, error: `Invalid cost: ${cost} - must be a number greater than 0` }, { status: 400 });
    }
    
    if (!action) {
      console.error("❌ Missing action/intent");
      return json({ ok: false, error: 'Missing action or intent' }, { status: 400 });
    }
    
    // Validate action values
    const allowedActions = ['image.gen', 'video.gen', 'mask.gen', 'emotionmask', 'preset', 'presets', 'custom', 'ghiblireact', 'neotokyoglitch'];
    if (!allowedActions.includes(action)) {
      console.error("❌ Invalid action:", action, "Allowed:", allowedActions);
      return json({ ok: false, error: `Invalid action: ${action}. Allowed: ${allowedActions.join(', ')}` }, { status: 400 });
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL!);
    console.log('💰 Neon database connection obtained');
    
    let rows: any[] = [];
    try {
      // Test database connection
      const testRows = await sql`SELECT NOW() as current_time`;
      console.log('💰 Database connection test successful:', testRows[0]);
      
      // Function check removed - we know app.reserve_credits exists
      console.log('💰 Skipping function check - app.reserve_credits is confirmed to exist');
      
      // 🔍 DEBUG: Check user's current credit balance before reservation
      console.log('🔍 Checking user credit balance before reservation...');
      const balanceCheck = await sql`SELECT balance FROM user_credits WHERE user_id = ${userId}`;
      console.log('🔍 Current credit balance:', balanceCheck[0]?.balance || 'No balance record found');
      
      // 💰 AUTO-INITIALIZE: Create user credits if they don't exist
      if (balanceCheck.length === 0 || !balanceCheck[0]?.balance) {
        console.log('💰 No credit balance found - initializing new user with starter credits...');
        
        try {
          // Get starter grant amount from app_config
          const starterRows = await sql`SELECT (value::text)::int AS v FROM app_config WHERE key='starter_grant'`;
          const STARTER_GRANT = starterRows[0]?.v ?? 30;
          
          console.log(`💰 Creating user_credits row with ${STARTER_GRANT} starter credits...`);
          
          // Check if user_credits table exists first
          const tableCheck = await sql`SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_credits'
          )`;
          console.log('🔍 user_credits table exists:', tableCheck[0]?.exists);
          
          if (!tableCheck[0]?.exists) {
            throw new Error('user_credits table does not exist in database');
          }
          
          // Insert starter credits (or update if exists with 0 balance)
          const insertResult = await sql`
            INSERT INTO user_credits(user_id, balance) 
            VALUES (${userId}, ${STARTER_GRANT})
            ON CONFLICT (user_id) DO UPDATE SET 
              balance = CASE 
                WHEN user_credits.balance IS NULL OR user_credits.balance = 0 
                THEN ${STARTER_GRANT} 
                ELSE user_credits.balance 
              END,
              updated_at = now()
            RETURNING user_id, balance
          `;
          console.log('🔍 INSERT result:', insertResult);
          
          // Create ledger entry for starter grant
          const ledgerResult = await sql`
            INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
            VALUES (${userId}, gen_random_uuid(), 'grant', ${STARTER_GRANT}, 'granted', jsonb_build_object('reason','starter'))
            ON CONFLICT DO NOTHING
            RETURNING id, user_id, amount
          `;
          console.log('🔍 Ledger INSERT result:', ledgerResult);
          
          console.log(`✅ Successfully initialized user with ${STARTER_GRANT} starter credits`);
          
          // Refresh balance check after initialization
          const refreshBalanceCheck = await sql`SELECT balance FROM user_credits WHERE user_id = ${userId}`;
          console.log('💰 Balance after initialization:', refreshBalanceCheck[0]?.balance || 'Still no balance');
          
        } catch (initError) {
          console.error('❌ Failed to initialize user credits:', initError);
                        return json({
          ok: false,
          error: "USER_CREDITS_INIT_FAILED",
          message: "Failed to initialize user credits",
          details: initError instanceof Error ? initError.message : String(initError)
        }, { status: "500" });
        }
      }
      
      // Final balance verification before proceeding
      const finalBalanceCheck = await sql`SELECT balance FROM user_credits WHERE user_id = ${userId}`;
      if (!finalBalanceCheck[0]?.balance) {
        console.error('❌ User still has no credits after initialization');
        return json({ 
          ok: false, 
          error: "USER_CREDITS_INIT_FAILED", 
          message: "Failed to initialize user credits properly" 
        }, { status: 500 });
      }
      
      console.log('💰 Final balance verification successful:', finalBalanceCheck[0].balance);
      console.log('💰 User has', finalBalanceCheck[0].balance, 'credits, requesting', cost, 'credits');
      
      // Check daily cap AFTER ensuring user has credits
      console.log('💰 Checking daily cap for user:', userId, 'cost:', cost, 'daily_cap:', config.daily_cap);
      const capOk = await sql`SELECT app.allow_today_simple(${userId}::uuid,${cost}::int) AS allowed`;
      console.log('💰 Daily cap check result:', capOk[0]);
      if (!capOk[0]?.allowed) {
        return json({ ok: false, error: "DAILY_CAP_REACHED" }, { status: 429 });
      }
      
      // 🔒 NEW: Check if user has negative balance and block until 24h reset
      console.log('🔒 Checking user credit balance for negative balance blocking...');
      const currentBalanceCheck = await sql`SELECT balance FROM user_credits WHERE user_id = ${userId}`;
      const currentBalance = currentBalanceCheck[0]?.balance || 0;
      
      if (currentBalance < 0) {
        console.log('🔒 User has negative balance:', currentBalance, '- blocking generation until 24h reset');
        return json({ 
          ok: false, 
          error: "NEGATIVE_BALANCE_BLOCKED",
          message: "You have exceeded your daily credit limit. Please wait until tomorrow for new credits.",
          currentBalance: currentBalance,
          blockedUntil: "24 hours from now"
        }, { status: 403 });
      }
      
      // 🔒 NEW: Check if user has insufficient credits for this request
      if (currentBalance < cost) {
        console.log('🔒 Insufficient credits:', currentBalance, '<', cost, '- blocking generation');
        return json({ 
          ok: false, 
          error: "INSUFFICIENT_CREDITS",
          message: `You need ${cost} credits but only have ${currentBalance}. Please wait for daily reset or upgrade your plan.`,
          currentBalance: currentBalance,
          requiredCredits: cost,
          shortfall: cost - currentBalance
        }, { status: 403 });
      }
      
      console.log('🔒 Credit balance check passed:', currentBalance, '>=', cost);
      
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
      
      console.log('💰 Calling app.reserve_credits with Neon tagged template');
      
      try {
        const result = await sql`SELECT * FROM app.reserve_credits(${userId}::uuid, ${request_id}::uuid, ${action}::text, ${cost}::int)`;
        rows = result;
        console.log('💰 Credits reserved successfully:', rows[0]);
        
        // Validate the return structure matches our SQL function
        if (!rows[0] || typeof rows[0].balance !== 'number') {
          console.error('❌ Unexpected return structure:', rows[0]);
                  return json({
          ok: false,
          error: "DB_UNEXPECTED_RETURN_STRUCTURE",
          message: `Expected {balance: number}, got: ${JSON.stringify(rows[0])}`,
        }, { status: 500 });
        }
        
        console.log('💰 Balance after reservation:', rows[0].balance);
        
        // Return success with request_id for finalization
        return json({
          ok: true,
          request_id: request_id,
          balance: rows[0].balance,
          cost: cost,
          action: action
        }, { status: 200 });
        
      } catch (dbError) {
        console.error("❌ reserve_credits() call failed:", dbError);
        return json({
          ok: false,
          error: "DB_RESERVE_CREDITS_FAILED",
          message: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : undefined,
        }, { status: 500 });
      }
      
    } catch (dbError) {
      console.error("💥 DB reservation failed:", dbError);
      return json({ 
        ok: false, 
        error: "Failed to reserve credits", 
        details: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("💥 Top-level error in credits-reserve:", error);
    return json({
      ok: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
