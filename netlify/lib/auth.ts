import { jwtVerify } from 'jose';

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
  const raw = event.headers?.authorization || event.headers?.Authorization || '';
  const m = String(raw).match(/^Bearer\s+(.+)$/i);
  if (!m) {
    const err = new Error('Missing Bearer token');
    (err as any).status = 401;
    throw err;
  }

  const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('AUTH_JWT_SECRET/JWT_SECRET not configured');
    (err as any).status = 500;
    throw err;
  }

  try {
    const { payload } = await jwtVerify(m[1], new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    const id = (payload.sub as string) || (payload.user_id as string) || (payload.userId as string) || (payload.uid as string) || (payload.id as string);
    if (!id) {
      const err = new Error('Token missing user id (expected sub/user_id/userId/uid/id)');
      (err as any).status = 401;
      throw err;
    }
    return { 
      id, 
      email: (payload.email as string) || null, 
      name: (payload.name as string) || null, 
      avatar_url: ((payload as any).avatar_url as string) || ((payload as any).picture as string) || null 
    };
  } catch (e: any) {
    e.status = 401;
    throw e;
  }
}

// Keep the existing getAuthedUser for backward compatibility
export async function getAuthedUser(event: any): Promise<{ user: AuthedUser | null; error?: string }> {
  try {
    const user = await requireUser(event);
    return { user };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}
