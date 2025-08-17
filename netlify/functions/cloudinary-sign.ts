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
  console.log('🔐 JWT verification:', {
    hasAuth: !!auth,
    startsWithBearer: auth?.startsWith('Bearer '),
    tokenLength: auth?.slice('Bearer '.length)?.length || 0,
    hasJWTSecret: !!process.env.JWT_SECRET
  });
  
  if (!auth?.startsWith('Bearer ')) throw new Error('No bearer token');
  const token = auth.slice('Bearer '.length);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable not set');
  }
  
  await jose.jwtVerify(token, secret); // will throw if invalid/expired
  return true;
}

export const handler: Handler = async (event) => {
  try {
    console.log('🔐 Cloudinary sign request:', {
      hasAuth: !!event.headers.authorization,
      authHeader: event.headers.authorization?.substring(0, 20) + '...',
      method: event.method,
      body: event.body
    });
    
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
    
    // Build signature string with only valid parameters (filter out undefined/null)
    const params: Record<string, string> = {
      timestamp: String(timestamp)
    };
    
    // Only add body parameters that have valid values
    if (body && typeof body === 'object') {
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = String(value);
        }
      });
    }
    
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
      signature: signature.substring(0, 8) + '...',
      hasFolder: !!body.folder,
      folderValue: body.folder,
      bodyKeys: Object.keys(body),
      bodyStringified: JSON.stringify(body)
    });

    return json(200, { 
      cloudName, 
      apiKey, 
      cloud_name: cloudName,  // Add snake_case for compatibility
      api_key: apiKey,        // Add snake_case for compatibility
      timestamp, 
      signature,
      folder: body.folder || 'stefna/sources'  // Return folder for frontend convenience
    });
  } catch (e: any) {
    return json(401, { error: e?.message || 'Unauthorized' });
  }
};
