import jwt from "jsonwebtoken";

// Support both environment variables temporarily during migration
const SECRET = 
  process.env.JWT_SECRET ||
  process.env.AUTH_JWT_SECRET ||
  (() => { throw new Error("Missing JWT secret - set either JWT_SECRET or AUTH_JWT_SECRET"); })();

const ISS = process.env.JWT_ISSUER || "stefna";

console.log('🔐 JWT Auth initialized with:', {
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasAuthJwtSecret: !!process.env.AUTH_JWT_SECRET,
  issuer: ISS
});

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { algorithm: "HS256", issuer: ISS, expiresIn: "30d" });
}

export function requireAuth(authorization?: string) {
  if (!authorization?.startsWith("Bearer ")) throw httpErr(401, "MISSING_BEARER");
  const token = authorization.slice(7);
  try {
    return jwt.verify(token, SECRET, { algorithms: ["HS256"], issuer: ISS }) as { userId: string };
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
