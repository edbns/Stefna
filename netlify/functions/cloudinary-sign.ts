// netlify/functions/cloudinary-sign.ts
import { withAuth } from './_withAuth';
import crypto from 'crypto';

export default withAuth(async (event, _user) => {
  const { params } = JSON.parse(event.body || "{}");
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  
  const toSign = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const signature = crypto.createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");

  return new Response(JSON.stringify({ ok: true, signature }), {
    headers: { "content-type": "application/json" },
  });
});
