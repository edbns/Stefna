import { neon } from '@neondatabase/serverless';

const url =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';

if (!url) {
  throw new Error('Missing NETLIFY_DATABASE_URL/NEON_DATABASE_URL/DATABASE_URL');
}

export const sql = neon(url); // tagged template: sql`select 1`;
