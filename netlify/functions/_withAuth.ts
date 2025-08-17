import type { Handler } from "@netlify/functions";
import { requireAuth } from "../lib/auth";

export function withAuth(fn: (e: any, u: any) => Promise<Response> | Response): Handler {
  return async (event) => {
    try {
      const user = requireAuth(event);
      return await fn(event, user);
    } catch (err: any) {
      // Normalize common auth failures
      const code =
        /NO_BEARER|jwt malformed|invalid signature|jwt expired|audience|issuer/i.test(err?.message)
          ? 401
          : 500;
      return new Response(JSON.stringify({ ok: false, error: err?.message || "AUTH_ERROR" }), {
        status: code,
        headers: { "content-type": "application/json" },
      });
    }
  };
}
