import { Pool } from "pg";
const { DATABASE_URL } = process.env;
if (!DATABASE_URL)
    throw new Error("DATABASE_URL is not set");
let pool;
export function getDb() {
    if (!pool) {
        pool = new Pool({
            connectionString: DATABASE_URL,
            max: 5,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 10000,
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
export async function getAppConfig(keys) {
    const db = getDb();
    let query;
    let params = [];
    if (keys && keys.length > 0) {
        query = "SELECT key, value FROM app_config WHERE key = ANY($1)";
        params = [keys];
    }
    else {
        query = "SELECT key, value FROM app_config";
    }
    const { rows } = await db.query(query, params);
    return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
}
