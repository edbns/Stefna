import { getDb } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json, mapPgError } from "./_lib/http";
export const handler = async (event) => {
    try {
        const { userId } = requireAuth(event.headers.authorization);
        const db = getDb();
        const [{ rows: signups }, { rows: grants }] = await Promise.all([
            db.query("SELECT count(*)::int AS count FROM referral_signups WHERE referrer_user_id=$1::uuid", [userId]),
            db.query(`SELECT coalesce(SUM(amount),0)::int AS granted
         FROM credits_ledger
         WHERE user_id=$1::uuid AND status='granted' AND action='referral.referrer'`, [userId]),
        ]);
        return json(200, { ok: true, referred_count: signups[0]?.count ?? 0, credits_from_referrals: grants[0]?.granted ?? 0 });
    }
    catch (e) {
        return mapPgError(e);
    }
};
