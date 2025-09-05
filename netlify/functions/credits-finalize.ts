import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { requireAuth } from "./_lib/auth";
import { json } from "./_lib/http";

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne, qCount for database operations
// - Maintains credit refund and commit logic
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
        },
        body: ''
      };
  }

  console.log('💰 [credits-finalize] Starting credits finalization...');
  console.log('💰 [credits-finalize] event.body:', event.body);
  console.log('💰 [credits-finalize] event.headers:', event.headers);
  
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({ ok: false, error: 'Method not allowed' })
      };
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
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({ ok: false, error: 'Missing or invalid userId' })
      };
    }
    
    if (!request_id) {
      console.error("❌ request_id is missing");
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({ ok: false, error: 'Missing request_id' })
      };
    }
    
    if (!disposition || !['commit', 'refund'].includes(disposition)) {
      console.error("❌ Invalid disposition:", disposition);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({ ok: false, error: 'Invalid disposition - must be "commit" or "refund"' })
      };
    }

    try {
      // Find the credit transaction
      const creditTransaction = await qOne(`
        SELECT id, user_id, amount, status FROM credits_ledger WHERE id = $1
      `, [request_id]);

      if (!creditTransaction) {
        console.error("❌ Credit transaction not found:", request_id);
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify({
            ok: false,
            error: "TRANSACTION_NOT_FOUND",
            message: "Credit transaction not found"
          })
        };
      }

      // Verify the transaction belongs to this user
      if (creditTransaction.user_id !== userId) {
        console.error("❌ Transaction belongs to different user:", {
          transactionUserId: creditTransaction.user_id,
          requestUserId: userId
        });
        return {
          statusCode: 403,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify({
            ok: false,
            error: "UNAUTHORIZED",
            message: "Transaction belongs to different user"
          })
        };
      }

      // Verify the transaction is still reserved
      if (creditTransaction.status !== 'reserved') {
        console.error("❌ Transaction already processed:", creditTransaction.status);
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify({
            ok: false,
            error: "ALREADY_PROCESSED",
            message: "Transaction already processed"
          })
        };
      }

      console.log('💰 Processing credit transaction:', {
        id: creditTransaction.id,
        amount: creditTransaction.amount,
        status: creditTransaction.status,
        disposition
      });

      if (disposition === 'refund') {
        // REFUND: Release reservation only (no balance change)
        // We hold credits in the ledger but do not deduct until commit
        console.log('💰 Processing credit refund (release hold only, no balance change)...');
        
        // Update transaction status to refunded
        await q(`
          UPDATE credits_ledger SET status = $1, updated_at = NOW() WHERE id = $2
        `, ['refunded', creditTransaction.id]);
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify({
            ok: true,
            disposition: 'refund',
            message: 'Reservation released; no balance change'
          })
        };
      } else if (disposition === 'commit') {
        // COMMIT: Actually deduct credits now and mark transaction as completed
        console.log('💰 Processing credit commit (deducting credits)...');
        
        // Get current user credits
        const userCredits = await qOne(`
          SELECT credits FROM user_credits WHERE user_id = $1
        `, [userId]);

        if (userCredits) {
          const deductAmount = Math.abs(creditTransaction.amount); // Convert negative to positive
          const newCredits = userCredits.credits - deductAmount;
          
          // Deduct credits from user balance
          await q(`
            UPDATE user_credits SET credits = $1, updated_at = NOW() WHERE user_id = $2
          `, [newCredits, userId]);

          // Update transaction status to completed
          await q(`
            UPDATE credits_ledger SET status = $1, updated_at = NOW() WHERE id = $2
          `, ['completed', creditTransaction.id]);

          console.log('✅ Credits committed and deducted successfully:', {
            deductAmount,
            oldCredits: userCredits.credits,
            newCredits
          });

          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
            body: JSON.stringify({
              ok: true,
              disposition: 'commit',
              deductAmount,
              newCredits,
              message: 'Credits committed and deducted successfully'
            })
          };
        } else {
          console.error('❌ User credits record not found for commit');
          return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
            body: JSON.stringify({
              ok: false,
              error: "USER_CREDITS_NOT_FOUND",
              message: "User credits record not found"
            })
          };
        }
      } else {
        // This should never happen due to validation above, but handle it just in case
        console.error("❌ Invalid disposition after validation:", disposition);
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
          body: JSON.stringify({
            ok: false,
            error: "INVALID_DISPOSITION",
            message: "Invalid disposition value"
          })
        };
      }
      
    } catch (dbError) {
      console.error("💥 DB finalization failed:", dbError);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
        body: JSON.stringify({
          ok: false,
          error: "DB_FINALIZATION_FAILED",
          message: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : undefined
        })
      };
    }
    
  } catch (error) {
    console.error("💥 Top-level error in credits-finalize:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
      body: JSON.stringify({
        ok: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  }
};
