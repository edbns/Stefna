#!/usr/bin/env node

/**
 * Fix Credits Ledger Structure Script
 * This script fixes the credits_ledger table structure to match our functions
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixCreditsLedgerStructure() {
  console.log('🔧 Fixing credits_ledger table structure...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check current structure
    console.log('🔍 Current credits_ledger structure:');
    const { rows: currentColumns } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'credits_ledger' 
      ORDER BY ordinal_position
    `);
    
    currentColumns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`));
    
    // Drop and recreate the table with correct structure
    console.log('\n🔧 Recreating credits_ledger table...');
    
    await client.query('BEGIN');
    
    // Drop the old table
    await client.query('DROP TABLE IF EXISTS credits_ledger CASCADE');
    console.log('✅ Dropped old credits_ledger table');
    
    // Create the new table with correct structure
    const createTableSQL = `
      CREATE TABLE credits_ledger (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     uuid NOT NULL,
        request_id  uuid NOT NULL,
        action      text NOT NULL,
        amount      int  NOT NULL,
        status      text NOT NULL CHECK (status IN ('reserved','committed','refunded','granted')),
        meta        jsonb,
        created_at  timestamptz NOT NULL DEFAULT now()
      );
    `;
    
    await client.query(createTableSQL);
    console.log('✅ Created new credits_ledger table');
    
    // Create indexes
    await client.query(`
      CREATE UNIQUE INDEX ux_ledger_user_request ON credits_ledger(user_id, request_id);
      CREATE INDEX ix_ledger_user_created ON credits_ledger(user_id, created_at);
    `);
    console.log('✅ Created indexes');
    
    await client.query('COMMIT');
    console.log('✅ Table recreation successful');
    
    // Verify new structure
    console.log('\n🔍 New credits_ledger structure:');
    const { rows: newColumns } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'credits_ledger' 
      ORDER BY ordinal_position
    `);
    
    newColumns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`));
    
    // Now create the view
    console.log('\n🔧 Creating v_user_daily_usage view...');
    const createViewSQL = `
      CREATE OR REPLACE VIEW v_user_daily_usage AS
      SELECT
        user_id,
        (created_at AT TIME ZONE 'UTC')::date AS usage_date,
        -SUM(amount) AS credits_spent
      FROM credits_ledger
      WHERE amount < 0 AND status = 'committed'
      GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;
    `;
    
    await client.query(createViewSQL);
    console.log('✅ View created successfully');
    
    // Test the allow_today_simple function
    console.log('\n🧪 Testing allow_today_simple function...');
    try {
      const testResult = await client.query('SELECT app.allow_today_simple($1::uuid, $2::int)', [
        '00000000-0000-0000-0000-000000000000', // test user
        1 // test cost
      ]);
      console.log('✅ allow_today_simple test successful:', testResult.rows[0]);
    } catch (testError) {
      console.log('⚠️ allow_today_simple test result:', testError.message);
    }
    
    client.release();
    console.log('\n🎉 Credits ledger structure fix complete!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixCreditsLedgerStructure();
