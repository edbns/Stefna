import type { Handler } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

// ============================================================================
// VERSION: 6.0 - PRISMA MIGRATION
// ============================================================================
// This function has been migrated to use Prisma instead of raw SQL
// - Replaced getDb() with PrismaClient
// - Removed dependency on non-existent database functions
// - Implemented actual credit refund logic
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

    try {
      // Find the credit transaction
      const creditTransaction = await prisma.creditTransaction.findUnique({
        where: { requestId: request_id }
      });

      if (!creditTransaction) {
        console.error("❌ Credit transaction not found:", request_id);
        return json({ 
          ok: false, 
          error: "TRANSACTION_NOT_FOUND",
          message: "Credit transaction not found"
        }, { status: 404 });
      }

      // Verify the transaction belongs to this user
      if (creditTransaction.userId !== userId) {
        console.error("❌ Transaction belongs to different user:", {
          transactionUserId: creditTransaction.userId,
          requestUserId: userId
        });
          return json({ 
            ok: false, 
          error: "UNAUTHORIZED",
          message: "Transaction belongs to different user"
        }, { status: 403 });
      }

      // Verify the transaction is still reserved
      if (creditTransaction.status !== 'reserved') {
        console.error("❌ Transaction already processed:", creditTransaction.status);
        return json({ 
          ok: false, 
          error: "ALREADY_PROCESSED",
          message: "Transaction already processed"
        }, { status: 400 });
      }

      console.log('💰 Processing credit transaction:', {
        id: creditTransaction.id,
        amount: creditTransaction.amount,
        status: creditTransaction.status,
        disposition
      });

      if (disposition === 'refund') {
        // REFUND: Restore credits to user
        console.log('💰 Processing credit refund...');
        
        // Update transaction status to refunded
        await prisma.creditTransaction.update({
          where: { id: creditTransaction.id },
          data: { status: 'refunded' }
        });

        // Restore credits to user balance
        const userCredits = await prisma.userCredits.findUnique({
          where: { userId: userId }
        });

        if (userCredits) {
          const refundAmount = Math.abs(creditTransaction.amount); // Convert negative to positive
          const newBalance = userCredits.balance + refundAmount;
          
          await prisma.userCredits.update({
            where: { user_id: userId },
            data: { 
              balance: newBalance,
              updated_at: new Date()
            }
          });

          console.log('✅ Credits refunded successfully:', {
            refundAmount,
            oldBalance: userCredits.balance,
            newBalance
          });

          return json({
            ok: true,
            disposition: 'refund',
            refundAmount,
            newBalance,
            message: 'Credits refunded successfully'
          });
        } else {
          console.error('❌ User credits record not found for refund');
          return json({ 
            ok: false, 
            error: "USER_CREDITS_NOT_FOUND",
            message: "User credits record not found"
          }, { status: 500 });
        }

      } else if (disposition === 'commit') {
        // COMMIT: Mark transaction as completed
        console.log('💰 Processing credit commit...');
        
        // Update transaction status to completed
        await prisma.creditTransaction.update({
          where: { id: creditTransaction.id },
          data: { status: 'completed' }
        });

        console.log('✅ Credits committed successfully');

        return json({
          ok: true,
          disposition: 'commit',
          message: 'Credits committed successfully'
        });
      }
      
    } catch (dbError) {
      console.error("💥 DB finalization failed:", dbError);
      return json({ 
        ok: false, 
        error: "DB_FINALIZATION_FAILED",
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("💥 Top-level error in credits-finalize:", error);
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
