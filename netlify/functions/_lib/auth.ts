import * as jwt from "jsonwebtoken";
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

export async function requireUser(event: any): Promise<{ id: string; email: string | null; name: string | null; avatar_url: string | null }> {
  try {
    const user = requireAuth(event.headers?.authorization || event.headers?.Authorization);
    return {
      id: user.userId,
      email: user.email || null,
      name: null,
      avatar_url: null
    };
  } catch (e: any) {
    e.status = 401;
    throw e;
  }
}

export async function getAuthedUser(event: any): Promise<{ user: any; error?: string }> {
  try {
    const user = await requireUser(event);
    return { user };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}
