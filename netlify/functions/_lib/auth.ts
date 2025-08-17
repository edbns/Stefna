import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

export type AuthUser = { userId: string; email?: string };

export function requireAuth(h?: string): AuthUser {
  if (!h?.startsWith("Bearer ")) { const e:any=new Error("Missing/invalid Authorization"); e.statusCode=401; throw e; }
  try {
    const decoded = jwt.verify(h.slice(7), JWT_SECRET) as any;
    const userId = decoded?.userId || decoded?.sub || decoded?.id;
    if (!userId) { const e:any=new Error("Token missing userId/sub"); e.statusCode=401; throw e; }
    return { userId, email: decoded?.email };
  } catch { const e:any=new Error("Invalid JWT"); e.statusCode=401; throw e; }
}
