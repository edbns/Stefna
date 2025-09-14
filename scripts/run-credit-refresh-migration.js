#!/usr/bin/env node

// ============================================================================
// CREDIT REFRESH MIGRATION RUNNER
// ============================================================================
// Runs the credit refresh trigger migration
// ============================================================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running credit refresh trigger migration...');
    
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'migrations', '20241220_add_credit_refresh_trigger.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Credit refresh trigger migration completed successfully');
    console.log('');
    console.log('📋 What was created:');
    console.log('  • queue_credit_refresh_emails() - Finds users needing refresh and queues emails');
    console.log('  • trigger_credit_refresh_check() - External function for cron services');
    console.log('  • Netlify function: trigger-credit-refresh.ts');
    console.log('');
    console.log('🚀 How to use:');
    console.log('  1. Set up external cron service (e.g., Cron-job.org)');
    console.log('  2. Call: https://stefna.xyz/.netlify/functions/trigger-credit-refresh');
    console.log('  3. Recommended frequency: Every hour');
    console.log('');
    console.log('📧 Emails will be queued in email_queue table and processed by existing system');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
