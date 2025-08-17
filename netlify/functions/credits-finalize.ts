import type { Handler } from "@netlify/functions";
import { getDb } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json, mapPgError } from "./_lib/http";

export const handler: Handler = async (event) => {
  try {
    const { userId } = requireAuth(event.headers.authorization);
    const body = event.body ? JSON.parse(event.body) : {};
    const request_id: string = body.request_id;
    const disposition: "commit" | "refund" = body.disposition;
    if (!request_id || !disposition) return json(400, { ok:false, error:"MISSING_PARAMS" });

    const db = getDb();
    await db.query("SELECT app.finalize_credits($1::uuid,$2::uuid,$3::text)", [userId, request_id, disposition]);
    return json(200, { ok:true, request_id, disposition });
  } catch (e) {
    return mapPgError(e);
  }
};
