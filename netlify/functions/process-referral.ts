import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from "./_lib/http";

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne, qCount for database operations
// - Processes referrals and grants credits
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
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

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { referrerEmail, newUserId, newUserEmail } = body;
    
    if (!referrerEmail || !newUserId || !newUserEmail) {
      return json({ ok: false, error: "MISSING_PARAMS" }, { status: 400 });
    }

    console.log('🔗 [Referral] Processing referral:', { referrerEmail, newUserId, newUserEmail });

    // Find referrer by email
    const referrer = await q(`
      SELECT id FROM users WHERE email = $1
    `, [referrerEmail]);
    
    if (!referrer || referrer.length === 0) {
      return json({ ok: false, error: "REFERRER_NOT_FOUND" }, { status: 404 });
    }
    
    const referrerId = referrer[0].id;

    // Check if this referral has already been processed
    const existingReferralGrant = await q(`
      SELECT id FROM credits_ledger 
      WHERE user_id = $1 AND reason = 'referral.referrer' AND action = 'referral'
    `, [referrerId]);
    
    if (existingReferralGrant && existingReferralGrant.length > 0) {
      console.log(`ℹ️ Referral already processed for user ${newUserId}`);
      return json({ ok: true, message: 'Referral already processed' });
    }

    // Use hardcoded bonus amounts since appConfig table doesn't exist
    const refBonus = 50; // Referrer gets 50 credits
    const newBonus = 25; // New user gets 25 credits

    // Grant to referrer
    const referrerCredits = await q(`
      INSERT INTO credits_ledger (id, user_id, action, status, reason, amount, env, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'referral', 'completed', 'referral.referrer', $2, 'production', NOW(), NOW())
      RETURNING id
    `, [referrerId, refBonus]);
    
    if (!referrerCredits || referrerCredits.length === 0) {
      throw new Error('Failed to create referrer credit transaction');
    }
    
    // Grant to new user
    const newUserCredits = await q(`
      INSERT INTO credits_ledger (id, user_id, action, status, reason, amount, env, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'referral', 'completed', 'referral.new', $2, 'production', NOW(), NOW())
      RETURNING id
    `, [newUserId, newBonus]);
    
    if (!newUserCredits || newUserCredits.length === 0) {
      throw new Error('Failed to create new user credit transaction');
    }

    // Update user credits balances
    const referrerBalance = await q(`
      INSERT INTO user_credits (user_id, credits, balance, updated_at)
      VALUES ($1, $2, 0, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET credits = user_credits.credits + $2, updated_at = NOW()
      RETURNING credits
    `, [referrerId, refBonus]);

    const newUserBalance = await q(`
      INSERT INTO user_credits (user_id, credits, balance, updated_at)
      VALUES ($1, $2, 0, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET credits = user_credits.credits + $2, updated_at = NOW()
      RETURNING credits
    `, [newUserId, newBonus]);

    console.log(`✅ Referral processed: ${refBonus} credits to referrer, ${newBonus} credits to new user`);
    console.log('💰 Referrer new balance:', referrerBalance[0]?.credits);
    console.log('💰 New user new balance:', newUserBalance[0]?.credits);
    
    // Send referral bonus email to referrer
    try {
      // Get referrer email
      const referrerData = await qOne(`
        SELECT email FROM users WHERE id = $1
      `, [referrerId]);
      
      if (referrerData?.email) {
        await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: referrerData.email,
            subject: 'You earned bonus credits',
            text: `Nice work!

You earned +50 credits for referring a friend to Stefna. They signed up and joined the fun.

Use your bonus now → stefna.xyz`,
            type: 'referral_bonus'
          })
        });
        console.log(`📧 Referral bonus email sent to referrer: ${referrerData.email}`);
      }
    } catch (emailError) {
      console.warn('⚠️ Failed to send referral bonus email:', emailError);
      // Don't fail the referral if email fails
    }
    
    return json({ 
      ok: true, 
      message: 'Referral processed successfully',
      referrerCredits: referrerBalance[0]?.credits || refBonus,
      newUserCredits: newUserBalance[0]?.credits || newBonus
    });
    
  } catch (error) {
    console.error('❌ Referral processing error:', error);
    return json({ 
      ok: false, 
      error: 'INTERNAL_ERROR', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
