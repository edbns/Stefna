const { neon } = require('@neondatabase/serverless');
const { requireJWTUser, resp, handleCORS, sanitizeDatabaseUrl } = require('./_auth');

// ---- Database connection with safe URL sanitization ----
const cleanDbUrl = sanitizeDatabaseUrl(process.env.NETLIFY_DATABASE_URL || '');
if (!cleanDbUrl) {
  throw new Error('NETLIFY_DATABASE_URL environment variable is required');
}
const sql = neon(cleanDbUrl);

exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    if (event.httpMethod !== 'POST') {
      return resp(405, { error: 'Method Not Allowed' });
    }

    const { referrerEmail, newUserId, newUserEmail } = JSON.parse(event.body || '{}');
    
    if (!referrerEmail || !newUserId || !newUserEmail) {
      return resp(400, { error: 'Referrer email, new user ID, and new user email required' });
    }

    // Auto-detect environment
    const APP_ENV = /netlify\.app$/i.test(event.headers.host || '') ? 'dev' : 'prod';
    console.log(`🎁 Processing referral in ${APP_ENV} env: ${referrerEmail} -> ${newUserEmail}`);

    // 1. Find the referrer by email
    const referrerResult = await sql`
      SELECT id, email
      FROM users 
      WHERE email = ${referrerEmail}
      LIMIT 1
    `;

    if (!referrerResult || referrerResult.length === 0) {
      console.log('❌ Invalid referrer email:', referrerEmail);
      return resp(404, { error: 'Invalid referrer email' });
    }

    const referrer = referrerResult[0];

    // 1b. Get or create referrer's referral stats (graceful fallback if table doesn't exist)
    let referrerStats = { total_invites: 0, total_tokens_earned: 0 };
    try {
      const statsResult = await sql`
        SELECT total_invites, total_tokens_earned
        FROM user_referrals 
        WHERE user_id = ${referrer.id}
        LIMIT 1
      `;
      
      if (statsResult && statsResult.length > 0) {
        referrerStats = statsResult[0];
      } else {
        // Create referral stats if they don't exist
        try {
          await sql`
            INSERT INTO user_referrals (user_id, total_invites, total_tokens_earned)
            VALUES (${referrer.id}, 0, 0)
          `;
        } catch (createError) {
          console.log('⚠️ Could not create referral stats (table may not exist):', createError.message);
        }
      }
    } catch (statsError) {
      console.log('⚠️ Referral stats table may not exist, using defaults:', statsError.message);
    }

    // 2. Check if this new user has already been referred (graceful fallback)
    let existingReferral = false;
    try {
      const existingResult = await sql`
        SELECT id
        FROM referral_signups 
        WHERE new_user_id = ${newUserId}
        LIMIT 1
      `;
      existingReferral = existingResult && existingResult.length > 0;
    } catch (existingError) {
      console.log('⚠️ Referral signups table may not exist, skipping duplicate check:', existingError.message);
    }

    if (existingReferral) {
      console.log('❌ User already referred:', newUserId);
      return resp(400, { error: 'User already referred' });
    }

    // 3. Award credits to referrer (10 credits)
    const referrerBonus = 10;
    try {
      await sql`
        INSERT INTO credits_ledger (
          user_id, amount, reason, request_id, env, created_at
        ) VALUES (
          ${referrer.id}, 
          ${referrerBonus}, 
          ${`referral_bonus_${newUserEmail}`}, 
          ${`ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}, 
          ${APP_ENV},
          NOW()
        )
      `;
    } catch (referrerCreditError) {
      console.error('❌ Failed to award referrer credits:', referrerCreditError);
      throw referrerCreditError;
    }

    // 4. Award credits to new user (5 credits)
    const newUserBonus = 5;
    try {
      await sql`
        INSERT INTO credits_ledger (
          user_id, amount, reason, request_id, env, created_at
        ) VALUES (
          ${newUserId}, 
          ${newUserBonus}, 
          ${`signup_bonus_${referrerEmail}`}, 
          ${`signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}, 
          ${APP_ENV},
          NOW()
        )
      `;
    } catch (newUserCreditError) {
      console.error('❌ Failed to award new user credits:', newUserCreditError);
      throw newUserCreditError;
    }

    // 5. Record the referral signup (graceful fallback)
    try {
      await sql`
        INSERT INTO referral_signups (
          referrer_user_id, referrer_email, new_user_id, new_user_email, 
          referrer_bonus, new_user_bonus, env, created_at
        ) VALUES (
          ${referrer.id}, ${referrerEmail}, ${newUserId}, ${newUserEmail},
          ${referrerBonus}, ${newUserBonus}, ${APP_ENV}, NOW()
        )
      `;
    } catch (signupError) {
      console.log('⚠️ Could not record referral signup (table may not exist):', signupError.message);
      // Don't throw - credits were awarded successfully
    }

    // 6. Update referrer's stats (graceful fallback)
    try {
      await sql`
        UPDATE user_referrals 
        SET total_invites = ${(referrerStats.total_invites || 0) + 1},
            total_tokens_earned = ${(referrerStats.total_tokens_earned || 0) + referrerBonus},
            last_invite_at = NOW()
        WHERE user_id = ${referrer.id}
      `;
    } catch (updateError) {
      console.log('⚠️ Could not update referrer stats (table may not exist):', updateError.message);
      // Don't throw - credits were awarded successfully
    }

    console.log(`✅ Referral processed successfully: ${referrerEmail} (+${referrerBonus}) -> ${newUserEmail} (+${newUserBonus})`);

    return resp(200, {
      success: true,
      referrerBonus,
      newUserBonus,
      totalAwarded: referrerBonus + newUserBonus
    });

  } catch (error) {
    console.error('❌ Process referral error:', error);
    return resp(500, { error: error.message || 'Internal server error' });
  }
};
