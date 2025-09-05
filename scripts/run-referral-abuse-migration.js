#!/usr/bin/env node

// Run referral abuse prevention migration
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runReferralAbusePreventionMigration() {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.log('Please set your DATABASE_URL environment variable and try again.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Running referral abuse prevention migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '20241220_add_referral_abuse_prevention.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSql);
    console.log('✅ Successfully ran referral abuse prevention migration');
    
    console.log('🎉 Referral abuse prevention migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runReferralAbusePreventionMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
