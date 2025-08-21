import type { Handler } from "@netlify/functions";
import { getDb } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
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

  console.log('💰 [credits-finalize] Starting credits finalization...');
  console.log('💰 [credits-finalize] event.body:', event.body);
  console.log('💰 [credits-finalize] event.headers:', event.headers);
  
  try {
    if (event.httpMethod !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    const { userId } = requireAuth(event.headers.authorization);
    console.log("👤 userId resolved:", userId);
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("📦 Request body parsed:", body);
    
    const { request_id, disposition } = body;
    
    console.log("💰 [credits-finalize] Parsed:", { userId, request_id, disposition });

    // Validation
    if (!userId) {
      console.error("❌ userId is missing or undefined");
      return json({ ok: false, error: 'Missing or invalid userId' }, { status: 400 });
    }
    
    if (!request_id) {
      console.error("❌ request_id is missing");
      return json({ ok: false, error: 'Missing request_id' }, { status: 400 });
    }
    
    if (!disposition || !['commit', 'refund'].includes(disposition)) {
      console.error("❌ Invalid disposition:", disposition);
      return json({ ok: false, error: 'Invalid disposition - must be "commit" or "refund"' }, { status: 400 });
    }

    const db = getDb();
    console.log('💰 Database connection obtained:', !!db);
    
    try {
      // Test database connection
      const { rows: testRows } = await db.query('SELECT NOW() as current_time');
      console.log('💰 Database connection test successful:', testRows[0]);
      
      // Check if app.finalize_credits function exists
      try {
        const { rows: funcCheck } = await db.query(`
          SELECT 
            n.nspname AS schema,
            p.proname AS function,
            pg_catalog.pg_get_function_arguments(p.oid) AS args
          FROM pg_catalog.pg_proc p
          JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          WHERE p.proname = 'finalize_credits' AND n.nspname = 'app'
        `);
        console.log('💰 Function check result:', funcCheck[0]);
        
        if (!funcCheck[0]) {
          console.error('❌ app.finalize_credits function not found!');
          return json({ 
            ok: false, 
            error: "DB_FUNCTION_MISSING",
            message: "app.finalize_credits function not found in database"
          }, { status: 500 });
        }
      } catch (funcError) {
        console.error('❌ Function check failed:', funcError);
        return json({ 
          ok: false, 
          error: "DB_FUNCTION_CHECK_FAILED",
          message: funcError?.message
        }, { status: 500 });
      }
      
      // Finalize credits using the new system
      console.log('💰 finalize_credits inputs:', {
        userId,
        request_id,
        disposition,
        userIdType: typeof userId,
        requestIdType: typeof request_id,
        dispositionType: typeof disposition
      });
      
      // Convert disposition to the format expected by SQL function
      const status = disposition === 'commit' ? 'commit' : 'refund';
      
      const sqlQuery = "SELECT app.finalize_credits($1::uuid, $2::uuid, $3::text)";
      const params = [userId, request_id, status];
      console.log('💰 SQL Query:', sqlQuery);
      console.log('💰 Parameters:', params);
      
      try {
        await db.query(sqlQuery, params);
        console.log('💰 Credits finalized successfully:', { disposition, status });
        
        // 📧 NEW: Check if we should send low credit warning after finalization
        if (disposition === 'commit') {
          try {
            console.log('📧 Checking if low credit warning email should be sent...');
            
            // Get current daily usage after this commit
            const { rows: dailyUsageRows } = await db.query(`
              SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 0) as daily_used
              FROM credits_ledger 
              WHERE user_id = $1::uuid 
              AND status = 'committed' 
              AND created_at >= (now() AT TIME ZONE 'UTC')::date
            `, [userId]);
            
            const dailyUsed = dailyUsageRows[0]?.daily_used || 0;
            const dailyCap = 30; // Default daily cap
            const usagePercentage = (dailyUsed / dailyCap) * 100;
            
            console.log('📧 Daily usage after finalization:', { dailyUsed, dailyCap, usagePercentage: usagePercentage.toFixed(1) + '%' });
            
            // Send warning emails at 80% and 90% thresholds
            if (usagePercentage >= 80 && usagePercentage < 90) {
              console.log('📧 Triggering 80% low credit warning email after finalization...');
              
              // Get user email
              const { rows: userRows } = await db.query(
                "SELECT email FROM auth.users WHERE id = $1::uuid",
                [userId]
              );
              
              const userEmail = userRows[0]?.email;
              if (userEmail) {
                // Send warning email asynchronously
                fetch('/.netlify/functions/send-credit-warning', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    to: userEmail,
                    usagePercentage: Math.round(usagePercentage),
                    dailyUsed,
                    dailyCap,
                    remainingCredits: dailyCap - dailyUsed
                  })
                }).catch(emailError => {
                  console.warn('📧 Low credit warning email failed after finalization (non-blocking):', emailError);
                });
              }
            } else if (usagePercentage >= 90) {
              console.log('📧 Triggering 90% critical low credit warning email after finalization...');
              
              const { rows: userRows } = await db.query(
                "SELECT email FROM auth.users WHERE id = $1::uuid",
                [userId]
              );
              
              const userEmail = userRows[0]?.email;
              if (userEmail) {
                // Send critical warning email
                fetch('/.netlify/functions/send-credit-warning', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    to: userEmail,
                    usagePercentage: Math.round(usagePercentage),
                    dailyUsed,
                    dailyCap,
                    remainingCredits: dailyCap - dailyUsed,
                    isCritical: true
                  })
                }).catch(emailError => {
                  console.warn('📧 Critical low credit warning email failed after finalization (non-blocking):', emailError);
                });
              }
            }
          } catch (emailError) {
            console.warn('📧 Failed to check/send low credit warning email after finalization (non-blocking):', emailError);
          }
        }
        
        // Get current balance for response
        const { rows: balanceRows } = await db.query(
          "SELECT balance FROM app.user_credits WHERE user_id = $1::uuid",
          [userId]
        );
        
        const currentBalance = balanceRows[0]?.balance || 0;
        console.log('💰 Current balance after finalization:', currentBalance);
        
        // Return success
        return json({
          ok: true,
          request_id: request_id,
          disposition: disposition,
          status: status,
          balance: currentBalance
        }, { status: 200 });
        
      } catch (dbError) {
        console.error("❌ finalize_credits() call failed:", dbError);
        return json({
          ok: false,
          error: "DB_FINALIZE_CREDITS_FAILED",
          message: dbError?.message,
          stack: dbError?.stack,
        }, { status: 500 });
      }
      
    } catch (dbError) {
      console.error("💥 DB finalization failed:", dbError);
      return json({ 
        ok: false, 
        error: "Failed to finalize credits", 
        details: dbError?.message,
        stack: dbError?.stack 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("💥 Top-level error in credits-finalize:", error);
    return json({
      ok: false,
      error: "Internal server error",
      details: error?.message,
      stack: error?.stack
    }, { status: 500 });
  }
};
