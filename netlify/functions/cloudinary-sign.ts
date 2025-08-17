import type { Handler } from '@netlify/functions';
import crypto from 'crypto';

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function requireAuth(authHeader?: string) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  // If you validate JWT signature/claims elsewhere, do it here.
  // For now just require presence. You can add jose/jwt verify if needed.
  return token.length > 10 ? token : null;
}

export const handler: Handler = async (event) => {
  const token = requireAuth(event.headers.authorization);
  if (!token) return json(401, { error: 'Unauthorized' });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return json(500, { error: 'Missing Cloudinary env (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)' });
  }

  // You can accept public params (e.g., folder) from body if you like
  const body = event.body ? JSON.parse(event.body) : {};
  const timestamp = Math.floor(Date.now() / 1000);

  // Build the string to sign per Cloudinary rules (sorted, ampersand-joined)
  // Here we sign just the timestamp; add "folder", "public_id", etc. if you include them.
  const toSign = `timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  return json(200, {
    cloudName: cloudName,
    apiKey: apiKey,
    timestamp,
    signature,
  });
};
