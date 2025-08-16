import { jwtVerify, JWTPayload } from 'jose';

export type AuthedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  [k: string]: any;
};

export async function getAuthedUser(event: any): Promise<{ user: AuthedUser | null; error?: string }> {
  const authHeader =
    event.headers?.authorization ??
    event.headers?.Authorization ??
    '';

  const token = (authHeader as string).replace(/^Bearer\s+/i, '');
  if (!token) return { user: null, error: 'No Authorization token' };

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return { user: null, error: 'Server misconfigured (AUTH_JWT_SECRET missing)' };

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });

    const sub = (payload.sub as string) || (payload.userId as string);
    if (!sub) return { user: null, error: 'Token missing sub/userId' };

    const user: AuthedUser = {
      id: sub,
      email: (payload.email as string) ?? null,
      name: (payload.name as string) ?? null,
      avatar_url: (payload.avatar_url as string) ?? (payload.picture as string) ?? null,
      ...payload,
    };

    return { user };
  } catch (e: any) {
    return { user: null, error: e?.message ?? 'Invalid token' };
  }
}
