import type { Handler } from "@netlify/functions";
import { getDb } from "./_lib/db";
import { requireAuth } from "./_lib/auth";
import { json, mapPgError } from "./_lib/http";
import { randomUUID } from "crypto";

export const handler: Handler = async (event) => {
  try {
    const { userId } = requireAuth(event.headers.authorization);
    const body = event.body ? JSON.parse(event.body) : {};
    const action: "image.gen" | "video.gen" = body.action;
    let request_id: string = body.request_id || randomUUID();
    if (!action) return json(400, { ok:false, error:"MISSING_ACTION" });

    const db = getDb();

    if (action === "video.gen") {
      const { rows } = await db.query("SELECT (value::text)::boolean AS enabled FROM app_config WHERE key='video_enabled'");
      if (!rows[0]?.enabled) return json(400, { ok:false, error:"VIDEO_DISABLED" });
    }

    const key = action === "image.gen" ? "image_cost" : "video_cost";
    const { rows: costRows } = await db.query("SELECT (value::text)::int AS cost FROM app_config WHERE key=$1", [key]);
    const cost = costRows[0]?.cost ?? 2;

    const { rows: capOk } = await db.query("SELECT app.allow_today_simple($1::uuid,$2::int) AS allowed", [userId, cost]);
    if (!capOk[0]?.allowed) return json(429, { ok:false, error:"DAILY_CAP_REACHED" });

    const { rows } = await db.query(
      "SELECT * FROM app.reserve_credits($1::uuid,$2::uuid,$3::text,$4::int)",
      [userId, request_id, action, cost]
    );

    return json(200, { ok:true, request_id, action, cost, balance: rows[0]?.balance ?? null });
  } catch (e) {
    return mapPgError(e);
  }
};
