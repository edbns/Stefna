import type { Handler } from "@netlify/functions";
import { getDb } from "./_lib/db";
import { json, mapPgError } from "./_lib/http";

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

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { referrerEmail, newUserId, newUserEmail } = body;
    
    if (!referrerEmail || !newUserId || !newUserEmail) {
      return json({ ok: false, error: "MISSING_PARAMS" }, { status: 400 });
    }

    const db = getDb();

    // Find referrer by email
    const { rows: ref } = await db.query("SELECT id FROM users WHERE lower(email)=lower($1) LIMIT 1", [referrerEmail]);
    if (!ref.length) {
      return json({ ok: false, error: "REFERRER_NOT_FOUND" }, { status: 404 });
    }
    const referrerId = ref[0].id;

    // Upsert referral row — unique on new_user_id prevents double awards
    await db.query(
      `INSERT INTO referral_signups(referrer_user_id, new_user_id, referrer_email, new_user_email)
       VALUES ($1::uuid,$2::uuid,$3,$4)
       ON CONFLICT (new_user_id) DO NOTHING`,
      [referrerId, newUserId, referrerEmail, newUserEmail]
    );

    // Only award if this is the first time (check ledger for existing referral grants)
    const already = await db.query(
      `SELECT 1 FROM credits_ledger
       WHERE user_id=$1::uuid AND status='granted' AND meta->>'reason'='referral_referrer'
       AND meta->>'new_user_id'=$2 LIMIT 1`,
      [referrerId, String(newUserId)]
    );
    
    if (!already.rowCount) {
      const { rows: rBonus } = await db.query("SELECT (value::text)::int AS v FROM app_config WHERE key='referral_referrer_bonus'");
      const { rows: nBonus } = await db.query("SELECT (value::text)::int AS v FROM app_config WHERE key='referral_new_bonus'");
      const refBonus = rBonus[0]?.v ?? 50;
      const newBonus = nBonus[0]?.v ?? 25;

      // Grant to referrer
      await db.query(
        "SELECT app.grant_credits($1::uuid,$2::int,'referral.referrer',jsonb_build_object('reason','referral_referrer','new_user_id',$3))",
        [referrerId, refBonus, String(newUserId)]
      );
      
      // Grant to new user
      await db.query(
        "SELECT app.grant_credits($1::uuid,$2::int,'referral.new',jsonb_build_object('reason','referral_new','referrer_user_id',$3))",
        [newUserId, newBonus, String(referrerId)]
      );

      console.log(`✅ Referral processed: ${refBonus} credits to referrer, ${newBonus} credits to new user`);
    } else {
      console.log(`ℹ️ Referral already processed for user ${newUserId}`);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('❌ Referral processing error:', e);
    return mapPgError(e);
  }
};
