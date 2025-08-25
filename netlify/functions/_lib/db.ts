import { Pool } from "pg";
import { neon } from '@neondatabase/serverless';

const { DATABASE_URL, NETLIFY_DATABASE_URL, NEON_DATABASE_URL } = process.env;

// Neon database connection (preferred)
const neonUrl = NETLIFY_DATABASE_URL || NEON_DATABASE_URL || DATABASE_URL;
if (!neonUrl) throw new Error('Missing NETLIFY_DATABASE_URL/NEON_DATABASE_URL/DATABASE_URL');

export const sql = neon(neonUrl); // tagged template: sql`select 1`;

// PostgreSQL pool connection (fallback)
let pool: Pool;
export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

/**
 * Get app configuration values from app_config table
 * @param keys Optional array of specific keys to fetch
 * @returns Object with key-value pairs
 */
export async function getAppConfig(keys?: string[]) {
  const db = getDb();
  
  let query: string;
  let params: any[] = [];
  
  if (keys && keys.length > 0) {
    query = "SELECT key, value FROM app_config WHERE key = ANY($1)";
    params = [keys];
  } else {
    query = "SELECT key, value FROM app_config";
  }
  
  const { rows } = await db.query(query, params);
  
  return Object.fromEntries(
    rows.map(({ key, value }) => [key, value])
  );
}
