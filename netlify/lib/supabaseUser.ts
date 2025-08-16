// Neon-compatible user client - replaces Supabase user client
// This provides the same interface for backward compatibility

import { neon } from '@neondatabase/serverless';

// Create Neon connection for user operations
const sql = neon(process.env.DATABASE_URL!);

export function getUserJwt(event: any) {
  const h = event.headers?.authorization || event.headers?.Authorization;
  if (!h) return null;
  const m = String(h).match(/^Bearer\s+(.+)/i);
  return m ? m[1] : null;
}

export function supabaseForUser(jwt: string | null) {
  console.warn('supabaseForUser() is deprecated. Use Neon sql directly instead.');
  
  // Return mock client that logs deprecation warnings
  return {
    from: (table: string) => {
      console.warn(`supabaseForUser.from('${table}') is deprecated. Use Neon sql directly instead.`);
      return {
        select: (columns: string = '*') => ({
          eq: (column: string, value: any) => ({
            single: async () => {
              try {
                const result = await sql`SELECT ${sql.unsafe(columns)} FROM ${sql.unsafe(table)} WHERE ${sql.unsafe(column)} = ${value} LIMIT 1`;
                return { data: result[0] || null, error: null };
              } catch (error: any) {
                return { data: null, error: { message: error.message } };
              }
            },
            limit: (count: number) => ({
              data: [],
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        update: (updates: any) => ({
          eq: (column: string, value: any) => ({
            select: (columns: string = '*') => ({
              data: null,
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        insert: (data: any) => ({
          select: (columns: string = '*') => ({
            data: null,
            error: { message: 'Use Neon sql directly instead' }
          })
        }),
        delete: () => ({
          eq: (column: string, value: any) => ({
            error: { message: 'Use Neon sql directly instead' }
          })
        })
      };
    }
  };
}

export function supabaseService() {
  console.warn('supabaseService() is deprecated. Use Neon sql directly instead.');
  
  // Return mock service client that logs deprecation warnings
  return {
    from: (table: string) => {
      console.warn(`supabaseService.from('${table}') is deprecated. Use Neon sql directly instead.`);
      return {
        select: (columns: string = '*') => ({
          eq: (column: string, value: any) => ({
            single: async () => {
              try {
                const result = await sql`SELECT ${sql.unsafe(columns)} FROM ${sql.unsafe(table)} WHERE ${sql.unsafe(column)} = ${value} LIMIT 1`;
                return { data: result[0] || null, error: null };
              } catch (error: any) {
                return { data: null, error: { message: error.message } };
              }
            },
            limit: (count: number) => ({
              data: [],
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        update: (updates: any) => ({
          eq: (column: string, value: any) => ({
            select: (columns: string = '*') => ({
              data: null,
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        insert: (data: any) => ({
          select: (columns: string = '*') => ({
            data: null,
            error: { message: 'Use Neon sql directly instead' }
          })
        }),
        delete: () => ({
          eq: (column: string, value: any) => ({
            error: { message: 'Use Neon sql directly instead' }
          })
        })
      };
    }
  };
}

// Export the Neon sql instance directly for new code
export { sql as neonUser };


