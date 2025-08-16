import { jwtVerify, JWTPayload } from 'jose';

export type AuthedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  [k: string]: any;
};

function bearerToken(event: any) {
  const h = event.headers || {};
  const raw =
    h.authorization ||
    h.Authorization ||
    h['x-authorization'] ||
    '';
  const m = String(raw).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : '';
}

export async function getAuthedUser(event: any): Promise<{ user: AuthedUser | null; error?: string }> {
  const token = bearerToken(event);
  if (!token) return { user: null, error: 'No Authorization token' };

  const secret =
    process.env.AUTH_JWT_SECRET ||
    process.env.JWT_SECRET ||
    '';
  if (!secret) return { user: null, error: 'Server misconfigured: AUTH_JWT_SECRET missing' };

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
    const id =
      (payload.sub as string) ||
      (payload.user_id as string) ||
      (payload.userId as string) ||
      (payload.uid as string) ||
      (payload.id as string);

    if (!id) return { user: null, error: 'Token missing user id (sub/user_id/userId/uid/id)' };

    return {
      user: {
        id,
        email: (payload.email as string) ?? null,
        name: (payload.name as string) ?? null,
        avatar_url: (payload.avatar_url as string) ?? (payload.picture as string) ?? null,
        ...payload,
      },
    };
  } catch (e: any) {
    return { user: null, error: `Invalid token: ${e?.message || 'unknown'}` };
  }
}
