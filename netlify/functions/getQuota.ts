import type { Handler } from "@netlify/functions";
import { requireAuth } from './_lib/auth';
import { qOne } from './_db';
import { json } from './_lib/http';

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced neon client with _db helper
// - Uses q, qOne, qCount for database operations
// - Gets user quota and usage information
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
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

  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId } = requireAuth(event.headers.authorization);
    
    console.log('📊 [Quota] Getting quota for user:', userId);

    // Get user's current credit balance
    const userCredits = await qOne(`
      SELECT credits, balance FROM user_credits WHERE user_id = $1
    `, [userId]);

    if (!userCredits) {
      // User doesn't have credits record, return default quota
      return json({
        ok: true,
        dailyCredits: 30,
        usedCredits: 0,
        remainingCredits: 30,
        dailyReset: new Date().toISOString().split('T')[0], // Today's date
        message: 'New user - starting with 30 daily credits'
      });
    }

    const currentCredits = userCredits.credits || 0;
    const dailyCredits = 30; // Daily credit limit
    const usedCredits = dailyCredits - currentCredits;
    const remainingCredits = currentCredits;

    // Calculate next daily reset (assuming reset at midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const quota = {
      daily_limit: dailyCredits,
      daily_used: Math.max(0, usedCredits),
      remaining: Math.max(0, remainingCredits),
      weekly_used: 0, // For compatibility with TokenService
      dailyReset: tomorrow.toISOString(),
      currentBalance: currentCredits, // This should show the actual credits (28), not the limit (30)
      timestamp: now.toISOString()
    };

    // Check if user is running low on credits and send warning email (only once per day)
    if (currentCredits <= 6) { // 6 credits = 3 images remaining
      try {
        // Check if we can send email (respects frequency limits)
        const canSendEmail = await qOne(`
          SELECT can_send_email($1, 'credit_warning', 24) as can_send
        `, [userId]);
        
        if (canSendEmail?.can_send) {
          // Get user email from the database
          const user = await qOne(`
            SELECT email FROM users WHERE id = $1
          `, [userId]);
          
          if (user?.email) {
            // Send low credit warning email
            await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: user.email,
                subject: "You're almost out of credits today",
                text: `Heads up — you're running low on credits.

Don't worry, they refresh daily. Want more? Invite a friend and earn bonus credits instantly.

Check your balance → stefna.xyz/profile

---
Don't want these emails? Unsubscribe here: https://stefna.xyz/unsubscribe?email=${encodeURIComponent(user.email)}&type=credit_warning`,
                type: 'credits_low',
                data: { remainingCredits: currentCredits }
              })
            });
            
            // Record that email was sent
            await qOne(`
              SELECT record_email_sent($1, 'credit_warning')
            `, [userId]);
            
            console.log(`📧 Low credit warning email sent to user ${userId} (${currentCredits} credits remaining)`);
          }
        } else {
          console.log(`📧 Credit warning email skipped for user ${userId} - already sent today`);
        }
      } catch (emailError) {
        console.warn('⚠️ Failed to send low credit warning email:', emailError);
        // Don't block quota check if email fails
      }
    }

    console.log('✅ [Quota] Retrieved quota:', quota);

    return json({
      ok: true,
      ...quota
    });

  } catch (error) {
    console.error('💥 [Quota] Error:', error);
    return json({ 
      ok: false,
      error: 'QUOTA_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
