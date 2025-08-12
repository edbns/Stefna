import { createClient } from '@supabase/supabase-js';

export function getUserJwt(event: any) {
  const h = event.headers?.authorization || event.headers?.Authorization;
  if (!h) return null;
  const m = String(h).match(/^Bearer\s+(.+)/i);
  return m ? m[1] : null;
}

export function supabaseForUser(jwt: string | null) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} },
  });
}

export function supabaseService() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}


