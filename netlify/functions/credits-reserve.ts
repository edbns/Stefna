import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";
import { randomUUID } from "crypto";

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function has been migrated to use raw SQL instead of Prisma
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne, qCount for database operations
// - Simplified credit reservation logic
// ============================================================================

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

  console.log('[credits-reserve] Starting credits reservation...');
  console.log('[credits-reserve] Method:', event.httpMethod);
  console.log('[credits-reserve] Authorization header present:', !!event.headers.authorization);
  
  try {
    if (event.httpMethod !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }

    // Enhanced authentication with better error handling
    let userId: string;
    try {
      const authResult = requireAuth(event.headers.authorization);
      userId = authResult.userId;
      console.log("[credits-reserve] User authenticated:", userId);
    } catch (authError: any) {
      console.error("[credits-reserve] Authentication failed:", authError.message);
      return json({ 
        ok: false, 
        error: 'AUTHENTICATION_FAILED',
        message: authError.message || 'Invalid or missing authentication token',
        details: 'Please sign in again'
      }, { status: 401 });
    }
    
    const body = event.body ? JSON.parse(event.body) : {};
    console.log("📦 Request body parsed:", body);
    
    const cost = body.cost || body.amount || 2; // Default to 2 credits (premium images)
    const action = body.action || body.intent || "image.gen";
    const request_id = body.request_id || body.requestId || randomUUID();

    console.log("[credits-reserve] Parsed:", { userId, request_id, action, cost });

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
    
    // Validate action values - updated to include all new generation types
    const allowedActions = [
      'image.gen', 'video.gen', 'mask.gen', 
      'unrealreflection', 'unreal_reflection_generation',
      'preset', 'presets', 'presets_generation',
      'custom', 'custom_prompt_generation',
      'ghiblireact', 'ghibli_reaction_generation',
      'neotokyoglitch', 'neo_glitch_generation',
      // edit mode
      'edit', 'edit_generation',
      // storytime aliases
      'storytime', 'story_time', 'story-time', 'story_time_create', 'story_time_generate', 'story_time_gen'
    ];
    if (!allowedActions.includes(action)) {
      console.error("❌ Invalid action:", action, "Allowed:", allowedActions);
      return json({ ok: false, error: `Invalid action: ${action}. Allowed: ${allowedActions.join(', ')}` }, { status: 500 });
    }

    try {
      // Check user's current credit balance
      console.log('🔍 Checking user credit balance before reservation...');
      
      let userCredits = await qOne<{
        user_id: string;
        credits: number;
        balance: number;
        updated_at: string;
      }>(`
        SELECT user_id, credits, balance, updated_at FROM user_credits WHERE user_id = $1
      `, [userId]);
      
      // Initialize user credits if they don't exist
      if (!userCredits) {
        console.log('💰 No credit balance found - initializing new user with starter credits...');
        
        try {
          // Create new user credits record with starter balance
          userCredits = await qOne(`
            INSERT INTO user_credits (user_id, credits, balance, updated_at)
            VALUES ($1, 30, 0, NOW())
            RETURNING user_id, credits, balance
          `, [userId]);
          
          console.log(`✅ Successfully initialized user with 30 starter credits`);
        } catch (initError) {
          console.error('❌ Failed to initialize user credits:', initError);
          return json({
            ok: false,
            error: "USER_CREDITS_INIT_FAILED",
            message: "Failed to initialize user credits",
            details: initError instanceof Error ? initError.message : String(initError)
          }, { status: 500 });
        }
      }
      
      // Personal 24-hour reset based on account creation time
      const dailyCredits = 30;
      const now = new Date();
      let currentBalance = (userCredits?.credits ?? 0);
      
      // Get user's account creation time
      const user = await qOne(`
        SELECT created_at FROM users WHERE id = $1
      `, [userId]);
      
      if (user?.created_at) {
        const accountCreated = new Date(user.created_at);
        const lastUpdate = userCredits?.updated_at ? new Date(userCredits.updated_at) : accountCreated;
        
        // Calculate next reset time (24 hours from last reset, or from account creation)
        const lastResetTime = lastUpdate > accountCreated ? lastUpdate : accountCreated;
        const nextResetTime = new Date(lastResetTime.getTime() + (24 * 60 * 60 * 1000));
        
        // If it's time for a reset (24 hours have passed)
        if (now >= nextResetTime) {
          await qOne(`
            UPDATE user_credits SET credits = $1, updated_at = NOW() WHERE user_id = $2 RETURNING credits
          `, [dailyCredits, userId]);
          currentBalance = dailyCredits;
          console.log(`🔄 [Credits] Personal 24h reset for user ${userId}: ${lastResetTime.toISOString()} → ${now.toISOString()}`);
        }
      }
      console.log('💰 Current balance:', currentBalance, 'credits, requesting:', cost, 'credits');
      
      // Check if user has insufficient credits
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
      
      // Create credit transaction record using raw SQL (HOLD credits, don't deduct yet)
      const creditTransactionResult = await q(`
        INSERT INTO credits_ledger (id, user_id, action, status, reason, amount, env, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, user_id, action, status, amount
      `, [request_id, userId, action, 'reserved', action, -cost, 'production']);

      if (!creditTransactionResult || creditTransactionResult.length === 0) {
        throw new Error('Failed to create credit transaction');
      }

      const creditTransaction = creditTransactionResult[0];
      console.log('💰 Credit transaction created (HOLDING credits):', creditTransaction.id);
      
      // DO NOT deduct credits yet - just hold them in the ledger
      // Credits will be deducted in finalize step if generation succeeds
      console.log('💰 Credits HELD (not deducted yet):', currentBalance, 'credits available');
        
      // Return success with request_id for finalization
      return json({
        ok: true,
        request_id: request_id,
        balance: currentBalance, // Return current balance (credits not deducted yet)
        cost: cost,
        action: action
      }, { status: 200 });
      
    } catch (dbError) {
      console.error("💥 DB reservation failed:", dbError);
      return json({ 
        ok: false, 
        error: "DB_RESERVATION_FAILED",
        message: dbError instanceof Error ? dbError.message : String(dbError),
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
};