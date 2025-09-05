import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from "./_lib/http";

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q, qOne, qCount for database operations
// - Processes referral signups and grants credits
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { referrerCode, newUserId } = body;

    if (!referrerCode || !newUserId) {
      return json({ error: 'Missing referrerCode or newUserId' }, { status: 400 });
    }

    console.log('🔗 [Referral] Processing referral signup:', { referrerCode, newUserId });

    // Find the referrer by their referral code
    const referrer = await q(`
      SELECT id, referral_code FROM users WHERE referral_code = $1
    `, [referrerCode]);

    if (!referrer || referrer.length === 0) {
      console.log('❌ [Referral] Referrer not found:', referrerCode);
      return json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const referrerId = referrer[0].id;
    console.log('✅ [Referral] Found referrer:', referrerId);

    // Check if this referral has already been processed
    const existingReferralGrant = await q(`
      SELECT id FROM credits_ledger 
      WHERE user_id = $1 AND reason = 'referral_signup' AND action = 'referral'
    `, [newUserId]);

    if (existingReferralGrant && existingReferralGrant.length > 0) {
      console.log('⚠️ [Referral] Referral already processed for user:', newUserId);
      return json({ error: 'Referral already processed' }, { status: 400 });
    }

    // Grant credits to the new user
    const newUserCredits = await q(`
      INSERT INTO credits_ledger (id, user_id, action, status, reason, amount, env, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'referral', 'completed', 'referral_signup', 10, 'production', NOW(), NOW())
      RETURNING id
    `, [newUserId]);

    if (!newUserCredits || newUserCredits.length === 0) {
      throw new Error('Failed to create new user credit transaction');
    }

    // Grant credits to the referrer
    const referrerCredits = await q(`
      INSERT INTO credits_ledger (id, user_id, action, status, reason, amount, env, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'referral', 'completed', 'referral_signup', 5, 'production', NOW(), NOW())
      RETURNING id
    `, [referrerId]);

    if (!referrerCredits || referrerCredits.length === 0) {
      throw new Error('Failed to create referrer credit transaction');
    }

    // Update user credits balances
    const newUserBalance = await q(`
      INSERT INTO user_credits (user_id, credits, balance, updated_at)
      VALUES ($1, 40, 0, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET credits = user_credits.credits + 10, updated_at = NOW()
      RETURNING credits
    `, [newUserId]);

    const referrerBalance = await q(`
      INSERT INTO user_credits (user_id, credits, balance, updated_at)
      VALUES ($1, 5, 0, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET credits = user_credits.credits + 5, updated_at = NOW()
      RETURNING credits
    `, [referrerId]);

    console.log('✅ [Referral] Successfully processed referral signup');
    console.log('💰 [Referral] New user credits:', newUserBalance[0]?.credits);
    console.log('💰 [Referral] Referrer credits:', referrerBalance[0]?.credits);

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

Use your bonus now → Stefna

Don't want these emails? Unsubscribe.`,
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
      success: true,
      message: 'Referral processed successfully',
      newUserCredits: newUserBalance[0]?.credits || 40,
      referrerCredits: referrerBalance[0]?.credits || 5
    });

  } catch (error) {
    console.error('💥 [Referral] Error processing referral signup:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
