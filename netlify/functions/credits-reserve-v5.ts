import type { Handler } from "@netlify/functions";
import { neon } from '@neondatabase/serverless';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";
import { randomUUID } from "crypto";

// ============================================================================
// VERSION: 5.0 - COMPLETE TOKEN SYSTEM OVERHAUL
// ============================================================================
// This is a completely new function file to force Netlify deployment
// - All token system fixes implemented
// - Proper database schema references
// - Complete error handling
// ============================================================================

export const handler: Handler = async (event) => {
  try {
    // Validate request method
    if (event.httpMethod !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const { action, cost } = body;

    // Validate required fields
    if (!action || !cost) {
      return json({ 
        ok: false, 
        error: 'Missing required fields: action and cost' 
      }, { status: 400 });
    }

    // Validate cost is a positive number
    if (typeof cost !== 'number' || cost <= 0) {
      return json({ 
        ok: false, 
        error: 'Cost must be a positive number' 
      }, { status: 400 });
    }

    // Get authenticated user
    const user = await requireAuth(event);
    if (!user) {
      return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.sub;
    console.log('💰 Credit reservation request:', { userId, action, cost });

    // Initialize database connection
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    try {
      // Check daily usage cap
      const dailyCapResult = await sql`SELECT app.allow_today_simple(${userId}::uuid, ${cost})`;
      const canUseToday = dailyCapResult[0]?.allow_today_simple;
      
      if (!canUseToday) {
        return json({
          ok: false,
          error: "DAILY_CAP_EXCEEDED",
          message: "Daily generation limit reached. Please try again tomorrow."
        }, { status: 429 });
      }

      // Generate unique request ID
      const request_id = randomUUID();
      
      // Reserve credits using the new system
      console.log('💰 Calling app.reserve_credits with schema prefixes');
      
      try {
        const result = await sql`SELECT * FROM app.reserve_credits(${userId}::uuid, ${request_id}::uuid, ${action}::text, ${cost}::int)`;
        
        if (!result[0] || typeof result[0].balance !== 'number') {
          console.error('❌ Unexpected return structure:', result[0]);
          return json({
            ok: false,
            error: "DB_UNEXPECTED_RETURN_STRUCTURE",
            message: `Expected {balance: number}, got: ${JSON.stringify(result[0])}`,
          }, { status: 500 });
        }
        
        console.log('💰 Credits reserved successfully:', result[0]);
        
        // Return success with request_id for finalization
        return json({
          ok: true,
          request_id: request_id,
          balance: result[0].balance,
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
    console.error("💥 Top-level error in credits-reserve-v5:", error);
    return json({
      ok: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
