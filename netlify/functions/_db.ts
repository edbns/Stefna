// netlify/functions/_q(ts
// 🗄️ Standardized DB helper using pg Pool
// Replaces PrismaClient for runtime database operations

import { Pool, QueryResultRow } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Neon pooler optimizations
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function q<T extends QueryResultRow = any>(text: string, params: (string | number)[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function qOne<T extends QueryResultRow = any>(text: string, params: (string | number)[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function qCount(text: string, params: (string | number)[] = []): Promise<number> {
  const result = await q<{ count: string }>(text, params);
  return parseInt(result[0]?.count || '0', 10);
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await pool.end();
});
