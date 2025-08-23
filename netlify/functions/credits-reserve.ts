import type { Handler } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";
import { randomUUID } from "crypto";

// ============================================================================
// VERSION: 6.0 - PRISMA MIGRATION
// ============================================================================
// This function has been migrated to use Prisma instead of raw SQL
// - Replaced neon client with PrismaClient
// - Removed dependency on non-existent database functions
// - Simplified credit reservation logic
// ============================================================================

const prisma = new PrismaClient();

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
    
    const cost = body.cost || body.amount || 1; // Default to 1 credit
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
    
    // Validate action values
    const allowedActions = ['image.gen', 'video.gen', 'mask.gen', 'emotionmask', 'preset', 'presets', 'custom', 'ghiblireact', 'neotokyoglitch'];
    if (!allowedActions.includes(action)) {
      console.error("❌ Invalid action:", action, "Allowed:", allowedActions);
      return json({ ok: false, error: `Invalid action: ${action}. Allowed: ${allowedActions.join(', ')}` }, { status: 500 });
    }

    try {
      // Check user's current credit balance
      console.log('🔍 Checking user credit balance before reservation...');
      
      let userCredits = await prisma.userCredits.findUnique({
        where: { userId: userId }
      });
      
      // Initialize user credits if they don't exist
      if (!userCredits) {
        console.log('💰 No credit balance found - initializing new user with starter credits...');
        
        try {
          // Create new user credits record with starter balance
          userCredits = await prisma.userCredits.create({
            data: {
              userId: userId,
              balance: 30, // Default starter credits
              updatedAt: new Date()
            }
          });
          
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
      
      const currentBalance = userCredits.balance || 0;
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
      
             // Create credit transaction record
       const creditTransaction = await prisma.creditTransaction.create({
         data: {
           userId: userId,
           requestId: request_id,
           action: action,
           amount: -cost, // Negative amount for credit usage
           status: 'pending',
           meta: { type: 'reservation' },
           createdAt: new Date()
         }
       });
      
      console.log('💰 Credit transaction created:', creditTransaction.id);
      
      // Update user credits balance
      const updatedCredits = await prisma.userCredits.update({
        where: { userId: userId },
        data: {
          balance: currentBalance - cost,
          updatedAt: new Date()
        }
      });
      
      console.log('💰 Balance updated:', updatedCredits.balance);
      
      // Return success with request_id for finalization
      return json({
        ok: true,
        request_id: request_id,
        balance: updatedCredits.balance,
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
  } finally {
    await prisma.$disconnect();
  }
};
