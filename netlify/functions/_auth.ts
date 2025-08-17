import jwt from "jsonwebtoken";

// Support both environment variables temporarily during migration
const SECRET = 
  process.env.AUTH_JWT_SECRET ?? 
  process.env.JWT_SECRET ?? 
  process.env.JWT_SECRET_ALT ?? 
  (() => { throw new Error("Missing JWT secret - set either AUTH_JWT_SECRET, JWT_SECRET, or JWT_SECRET_ALT"); })();

const ISS = process.env.JWT_ISSUER ?? "stefna";
const AUD = process.env.JWT_AUDIENCE ?? "stefna-app";

console.log('🔐 JWT Auth initialized with:', {
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasAuthJwtSecret: !!process.env.AUTH_JWT_SECRET,
  hasJwtSecretAlt: !!process.env.JWT_SECRET_ALT,
  issuer: ISS,
  audience: AUD
});

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { algorithm: "HS256", issuer: ISS, audience: AUD, expiresIn: "30d" });
}

export function requireAuth(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) throw httpErr(401, "MISSING_BEARER");
  const token = authorization.slice(7);
  try {
    return jwt.verify(token, SECRET, { algorithms: ["HS256"], issuer: ISS, audience: AUD }) as { userId: string };
  } catch {
    throw httpErr(401, "INVALID_JWT");
  }
}

export function httpErr(status: number, code: string, extra: any = {}) {
  const err: any = new Error(code);
  err.statusCode = status;
  err.code = code;
  err.extra = extra;
  return err;
}

// Utility functions for other functions
export function resp(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}

export function handleCORS(event: any) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }
  return null; // No CORS response needed
}

export function sanitizeDatabaseUrl(url: string): string {
  if (!url) return '';
  
  // Basic URL validation and sanitization
  try {
    const parsed = new URL(url);
    // Ensure it's a postgresql URL
    if (parsed.protocol !== 'postgresql:') {
      throw new Error('Invalid database protocol');
    }
    return url;
  } catch {
    throw new Error('Invalid database URL format');
  }
}
