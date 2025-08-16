// Neon-compatible user client - replaces Supabase user client
// This provides the same interface for backward compatibility

const { neon } = require('@neondatabase/serverless');

// Create Neon connection for user operations
const sql = neon(process.env.DATABASE_URL);

function getUserJwt(event) {
  const h = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!h) return null;
  const m = String(h).match(/^Bearer\s+(.+)/i);
  return m ? m[1] : null;
}

function getSubUnsafe(jwt) {
  if (!jwt) return null;
  try {
    const parts = String(jwt).split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return String(payload.sub || payload.user_id || payload.uid || payload.id || '');
  } catch {
    return null;
  }
}

function supabaseForUser(jwt) {
  console.warn('supabaseForUser() is deprecated. Use Neon sql directly instead.');
  
  // Return mock client that logs deprecation warnings
  return {
    from: (table) => {
      console.warn(`supabaseForUser.from('${table}') is deprecated. Use Neon sql directly instead.`);
      return {
        select: (columns = '*') => ({
          eq: (column, value) => ({
            single: async () => {
              try {
                const result = await sql`SELECT ${sql.unsafe(columns)} FROM ${sql.unsafe(table)} WHERE ${sql.unsafe(column)} = ${value} LIMIT 1`;
                return { data: result[0] || null, error: null };
              } catch (error) {
                return { data: null, error: { message: error.message } };
              }
            },
            limit: (count) => ({
              data: [],
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        update: (updates) => ({
          eq: (column, value) => ({
            select: (columns = '*') => ({
              data: null,
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        insert: (data) => ({
          select: (columns = '*') => ({
            data: null,
            error: { message: 'Use Neon sql directly instead' }
          })
        }),
        delete: () => ({
          eq: (column, value) => ({
            error: { message: 'Use Neon sql directly instead' }
          })
        })
      };
    }
  };
}

function supabaseService() {
  console.warn('supabaseService() is deprecated. Use Neon sql directly instead.');
  
  // Return mock service client that logs deprecation warnings
  return {
    from: (table) => {
      console.warn(`supabaseService.from('${table}') is deprecated. Use Neon sql directly instead.`);
      return {
        select: (columns = '*') => ({
          eq: (column, value) => ({
            single: async () => {
              try {
                const result = await sql`SELECT ${sql.unsafe(columns)} FROM ${sql.unsafe(table)} WHERE ${sql.unsafe(column)} = ${value} LIMIT 1`;
                return { data: result[0] || null, error: null };
              } catch (error) {
                return { data: null, error: { message: error.message } };
              }
            },
            limit: (count) => ({
              data: [],
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        update: (updates) => ({
          eq: (column, value) => ({
            select: (columns = '*') => ({
              data: null,
              error: { message: 'Use Neon sql directly instead' }
            })
          })
        }),
        insert: (data) => ({
          select: (columns = '*') => ({
            data: null,
            error: { message: 'Use Neon sql directly instead' }
          })
        }),
        delete: () => ({
          eq: (column, value) => ({
            error: { message: 'Use Neon sql directly instead' }
          })
        })
      };
    }
  };
}

module.exports = { 
  getUserJwt, 
  getSubUnsafe, 
  supabaseForUser, 
  supabaseService,
  neonUser: sql  // Export Neon sql instance directly for new code
};
