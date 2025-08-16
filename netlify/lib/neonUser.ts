// Neon-compatible user client - replaces Supabase user client
import { sql } from '@neondatabase/serverless';

// Mock Neon user client interface for backward compatibility
export const neonUser = {
  from: (table: string) => {
    console.warn(`neonUser.from('${table}') is deprecated. Use Neon sql directly instead.`);
    return {
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) })
    };
  }
};

// Legacy export for backward compatibility
export const supabaseUser = neonUser;


