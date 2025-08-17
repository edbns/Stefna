import type { Handler } from "@netlify/functions";
import { getDb, getAppConfig } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  console.log('🧪 [test-credits] Testing credit system...');
  
  try {
    if (event.httpMethod !== 'GET') {
      return json(405, { ok: false, error: 'Method not allowed' });
    }

    const { userId } = requireAuth(event.headers.authorization);
    console.log("👤 userId resolved:", userId);
    
    const db = getDb();
    console.log('💰 Database connection obtained:', !!db);
    
    // Test 1: Check if required functions exist
    console.log('🧪 Test 1: Checking required functions...');
    
    const { rows: reserveCheck } = await db.query(`
      SELECT 
        n.nspname AS schema,
        p.proname AS function,
        pg_catalog.pg_get_function_arguments(p.oid) AS args
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'reserve_credits' AND n.nspname = 'app'
    `);
    
    const { rows: finalizeCheck } = await db.query(`
      SELECT 
        n.nspname AS schema,
        p.proname AS function,
        pg_catalog.pg_get_function_arguments(p.oid) AS args
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'finalize_credits' AND n.nspname = 'app'
    `);
    
    // Test 2: Check app_config values
    console.log('🧪 Test 2: Checking app_config...');
    const config = await getAppConfig(['image_cost', 'daily_cap']);
    
    // Test 3: Check user's current balance
    console.log('🧪 Test 3: Checking user balance...');
    const { rows: balanceRows } = await db.query(
      "SELECT balance FROM app.user_credits WHERE user_id = $1::uuid",
      [userId]
    );
    
    const currentBalance = balanceRows[0]?.balance || 0;
    
    // Test 4: Check daily usage
    console.log('🧪 Test 4: Checking daily usage...');
    const { rows: dailyRows } = await db.query(
      "SELECT app.allow_today_simple($1::uuid, $2::int) AS allowed",
      [userId, parseInt(config.image_cost) || 2]
    );
    
    const dailyAllowed = dailyRows[0]?.allowed || false;
    
    return json(200, {
      ok: true,
      tests: {
        function_check: {
          reserve_credits: !!reserveCheck[0],
          finalize_credits: !!finalizeCheck[0],
          reserve_signature: reserveCheck[0]?.args || 'not found',
          finalize_signature: finalizeCheck[0]?.args || 'not found'
        },
        config: {
          image_cost: config.image_cost,
          daily_cap: config.daily_cap
        },
        user: {
          current_balance: currentBalance,
          daily_allowed: dailyAllowed,
          can_generate: dailyAllowed && currentBalance >= (parseInt(config.image_cost) || 2)
        }
      },
      message: 'Credit system test completed successfully'
    });
    
  } catch (error: any) {
    console.error("💥 Test failed:", error);
    return json(500, {
      ok: false,
      error: "Test failed",
      details: error?.message,
      stack: error?.stack
    });
  }
};
