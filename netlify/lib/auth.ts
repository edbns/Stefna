import * as jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;
if (!SECRET) throw new Error("JWT_SECRET is not set");

const ISS = process.env.JWT_ISSUER ?? "stefna";
const AUD = process.env.JWT_AUDIENCE ?? "stefna-app";

export type JwtUser = { sub: string; email?: string; role?: string };

export function signUserToken(user: { id: string; email?: string }) {
  return jwt.sign({ sub: user.id, email: user.email, role: "user" }, SECRET, {
    algorithm: "HS256",
    expiresIn: "30d",
    issuer: ISS,
    audience: AUD,
  });
}

export function verifyBearer(header?: string): JwtUser {
  const token = header?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("NO_BEARER");
  return jwt.verify(token, SECRET, {
    algorithms: ["HS256"],
    issuer: ISS,
    audience: AUD,
  }) as JwtUser;
}

// Small helper to use inside handlers
export function requireAuth(req: any) {
  return verifyBearer(req.headers?.authorization || req.headers?.Authorization);
}

// Keep backward compatibility for existing code
export type AuthedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  [k: string]: any;
};

export function getBearer(event: any) {
  const h = event.headers || {};
  const raw = h.authorization || h.Authorization || '';
  const m = String(raw).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : '';
}

export async function requireUser(event: any) {
  try {
    const user = verifyBearer(event.headers?.authorization || event.headers?.Authorization);
    return { 
      id: user.sub, 
      email: user.email || null, 
      name: null, 
      avatar_url: null 
    };
  } catch (e: any) {
    e.status = 401;
    throw e;
  }
}

export async function getAuthedUser(event: any): Promise<{ user: AuthedUser | null; error?: string }> {
  try {
    const user = await requireUser(event);
    return { user };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}
