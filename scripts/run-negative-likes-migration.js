#!/usr/bin/env node

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Read the migration file
    const migrationPath = join(__dirname, '20241220_fix_negative_likes.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration: fix_negative_likes.sql');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the fix worked
    const result = await client.query(`
      SELECT COUNT(*) as negative_count 
      FROM users 
      WHERE total_likes_received < 0
    `);
    
    console.log(`🔍 Users with negative likes: ${result.rows[0].negative_count}`);
    
    if (result.rows[0].negative_count === '0') {
      console.log('✅ All negative values have been fixed!');
    } else {
      console.log('⚠️ Some negative values still exist');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
