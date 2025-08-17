import { withAuth } from "./_withAuth";

export const handler = withAuth(async (_e, u) =>
  new Response(JSON.stringify({ ok: true, user: u }), { 
    headers: { "content-type": "application/json" } 
  })
);

