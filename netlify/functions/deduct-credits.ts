import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';
import { requireUser } from '../lib/auth';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    // Authenticate user
    const user = await requireUser(event);
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { amount, reason, requestId } = body;
    
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'Invalid amount. Must be positive number.' 
        })
      };
    }

    // Ensure credits_ledger table exists
    await sql`
      CREATE TABLE IF NOT EXISTS credits_ledger (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount != 0),
        reason TEXT NOT NULL,
        env TEXT DEFAULT 'production',
        request_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Check current credit balance
    const currentCredits = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_credits
      FROM credits_ledger 
      WHERE user_id = ${user.id}
    `;
    
    let totalCredits = currentCredits[0]?.total_credits || 0;
    console.log(`💰 User ${user.id} has ${totalCredits} credits, trying to deduct ${amount}`);

    // If user has no credits, give them initial credits
    if (totalCredits === 0) {
      const initialCredits = 10;
      await sql`
        INSERT INTO credits_ledger (user_id, amount, reason, request_id, env)
        VALUES (${user.id}, ${initialCredits}, 'initial_signup_bonus', ${requestId || 'system'}, ${process.env.NODE_ENV || 'production'})
      `;
      console.log(`🎁 Gave ${initialCredits} initial credits to user ${user.id}`);
      totalCredits = initialCredits;
    }

    // Check if user has enough credits
    if (totalCredits < amount) {
      return {
        statusCode: 402,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'Insufficient credits',
          currentCredits: totalCredits,
          requestedAmount: amount,
          shortfall: amount - totalCredits
        })
      };
    }

    // Deduct credits
    const deduction = await sql`
      INSERT INTO credits_ledger (user_id, amount, reason, request_id, env)
      VALUES (${user.id}, ${-amount}, ${reason || 'media_generation'}, ${requestId || 'system'}, ${process.env.NODE_ENV || 'production'})
      RETURNING id, amount, created_at
    `;

    const newBalance = totalCredits - amount;
    console.log(`✅ Successfully deducted ${amount} credits from user ${user.id}. New balance: ${newBalance}`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        deducted: amount,
        newBalance,
        transactionId: deduction[0].id,
        message: `Successfully deducted ${amount} credits`
      })
    };

  } catch (error: any) {
    console.error('❌ Deduct credits error:', error);
    
    const statusCode = error?.status || 500;
    return {
      statusCode,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: false,
        error: error.message || 'Internal server error',
        statusCode
      })
    };
  }
};
