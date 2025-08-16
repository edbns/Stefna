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
  const token = getBearer(event);
  if (!token) throw new Error('No Authorization token');

  const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Server misconfigured: AUTH_JWT_SECRET missing');

  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
  const id =
    (payload.sub as string) ||
    (payload.user_id as string) ||
    (payload.userId as string) ||
    (payload.uid as string) ||
    (payload.id as string);

  if (!id) throw new Error('Token missing user id (sub/user_id/userId/uid/id)');
  return {
    id,
    email: (payload.email as string) || null,
    name: (payload.name as string) || null,
    avatar_url: (payload.avatar_url as string) || (payload.picture as string) || null,
  };
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
