import type { Handler } from '@netlify/functions';
import crypto from 'crypto';
import * as jose from 'jose';

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function verifyJWT(auth?: string) {
  if (!auth?.startsWith('Bearer ')) throw new Error('No bearer token');
  const token = auth.slice('Bearer '.length);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  await jose.jwtVerify(token, secret); // will throw if invalid/expired
  return true;
}

export const handler: Handler = async (event) => {
  try {
    await verifyJWT(event.headers.authorization);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return json(500, { error: 'Missing Cloudinary env (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    return json(200, { cloudName, apiKey, timestamp, signature });
  } catch (e: any) {
    return json(401, { error: e?.message || 'Unauthorized' });
  }
};
