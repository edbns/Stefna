// Neon-compatible admin client - replaces Supabase admin
// This provides the same interface for backward compatibility

import { neon } from '@neondatabase/serverless';

// Create Neon connection for admin operations
const sql = neon(process.env.DATABASE_URL!);

// Mock Supabase admin client interface for backward compatibility
export const supabaseAdmin = {
  from: (table: string) => {
    console.warn(`supabaseAdmin.from('${table}') is deprecated. Use Neon sql directly instead.`);
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
      })
    };
  },
  
  // Direct Neon access for new code
  neon: sql
};

// Export the Neon sql instance directly for new code
export { sql as neonAdmin };
