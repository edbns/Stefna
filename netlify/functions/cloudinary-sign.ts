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

    // Parse request body for additional parameters
    let body = {};
    try {
      if (event.body) {
        body = JSON.parse(event.body);
      }
    } catch (e) {
      // Ignore parsing errors, use empty object
    }

    const timestamp = Math.floor(Date.now() / 1000);
    
    // Build signature string with all parameters
    const params: Record<string, string> = {
      timestamp: String(timestamp),
      ...body
    };
    
    // Sort parameters alphabetically and build signature string
    const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`);
    const toSign = sortedParams.join('&') + apiSecret;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');
    
    // Debug logging
    console.log('🔐 Cloudinary signature debug:', {
      receivedBody: body,
      params,
      sortedParams,
      toSign: toSign.replace(apiSecret, '[HIDDEN]'),
      signature: signature.substring(0, 8) + '...'
    });

    return json(200, { cloudName, apiKey, timestamp, signature });
  } catch (e: any) {
    return json(401, { error: e?.message || 'Unauthorized' });
  }
};
