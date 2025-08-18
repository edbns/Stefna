import { sql } from '../lib/db';
import { requireUser } from '../lib/auth';
export const handler = async (event) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            }
        };
    }
    try {
        // Authenticate user
        const user = await requireUser(event);
        // Ensure credits_ledger table exists
        await sql `
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
        // Get current credit balance
        const currentCredits = await sql `
      SELECT COALESCE(SUM(amount), 0) as total_credits
      FROM credits_ledger 
      WHERE user_id = ${user.id}
    `;
        const totalCredits = currentCredits[0]?.total_credits || 0;
        // Get recent credit history
        const recentTransactions = await sql `
      SELECT amount, reason, created_at
      FROM credits_ledger 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 10
    `;
        console.log(`💰 User ${user.id} has ${totalCredits} credits`);
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                ok: true,
                credits: totalCredits,
                recentTransactions: recentTransactions.map(t => ({
                    amount: t.amount,
                    reason: t.reason,
                    date: t.created_at
                })),
                message: `Current balance: ${totalCredits} credits`
            })
        };
    }
    catch (error) {
        console.error('❌ Check credits error:', error);
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
