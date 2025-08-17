#!/usr/bin/env node

/**
 * Verify Credits System Script
 * This script checks if the entire credits system is working properly
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyCreditsSystem() {
  console.log('🔍 Verifying entire credits system...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // 1. Check if all required tables exist
    console.log('\n📋 Checking required tables...');
    const requiredTables = ['credits_ledger', 'user_credits', 'app_config'];
    
    for (const table of requiredTables) {
      try {
        const { rows } = await client.query(`
          SELECT COUNT(*) as count FROM ${table}
        `);
        console.log(`✅ ${table}: exists with ${rows[0].count} rows`);
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }
    
    // 2. Check if all required functions exist
    console.log('\n📋 Checking required functions...');
    const requiredFunctions = ['reserve_credits', 'finalize_credits', 'allow_today_simple', 'cfg_int'];
    
    for (const func of requiredFunctions) {
      try {
        const { rows } = await client.query(`
          SELECT COUNT(*) as count 
          FROM pg_proc p 
          JOIN pg_namespace n ON n.oid = p.pronamespace 
          WHERE p.proname = $1 AND n.nspname = 'app'
        `, [func]);
        
        if (rows[0].count > 0) {
          console.log(`✅ app.${func}: exists`);
        } else {
          console.log(`❌ app.${func}: missing`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${func}: ${error.message}`);
      }
    }
    
    // 3. Check if required view exists
    console.log('\n📋 Checking required views...');
    try {
      const { rows } = await client.query(`
        SELECT COUNT(*) as count 
        FROM pg_views 
        WHERE viewname = 'v_user_daily_usage'
      `);
      
      if (rows[0].count > 0) {
        console.log('✅ v_user_daily_usage: exists');
      } else {
        console.log('❌ v_user_daily_usage: missing');
      }
    } catch (error) {
      console.log(`❌ Error checking view: ${error.message}`);
    }
    
    // 4. Test the complete credit reservation flow
    console.log('\n🧪 Testing complete credit reservation flow...');
    
    // Test user ID (use a test UUID)
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const testRequestId = '11111111-1111-1111-1111-111111111111';
    
    try {
      // Test 1: Check daily cap
      console.log('  🔍 Testing daily cap check...');
      const capResult = await client.query('SELECT app.allow_today_simple($1::uuid, $2::int)', [testUserId, 1]);
      console.log(`    ✅ Daily cap check: ${JSON.stringify(capResult.rows[0])}`);
      
      // Test 2: Try to reserve credits (should fail due to insufficient credits, but function should work)
      console.log('  🔍 Testing credit reservation...');
      try {
        const reserveResult = await client.query('SELECT * FROM app.reserve_credits($1::uuid, $2::uuid, $3::text, $4::int)', 
          [testUserId, testRequestId, 'test', 1]);
        console.log(`    ✅ Credit reservation: ${JSON.stringify(reserveResult.rows[0])}`);
      } catch (reserveError) {
        if (reserveError.message.includes('INSUFFICIENT_CREDITS')) {
          console.log('    ✅ Credit reservation: correctly caught insufficient credits (expected)');
        } else {
          console.log(`    ❌ Credit reservation error: ${reserveError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`    ❌ Flow test failed: ${error.message}`);
    }
    
    // 5. Check if there are any missing grants or permissions
    console.log('\n🔐 Checking permissions...');
    try {
      const { rows: permissions } = await client.query(`
        SELECT grantee, privilege_type, table_name
        FROM information_schema.role_table_grants 
        WHERE table_name IN ('credits_ledger', 'user_credits', 'app_config')
        AND grantee = 'authenticated'
      `);
      
      if (permissions.length > 0) {
        console.log('✅ Permissions found for authenticated users');
        permissions.forEach(p => console.log(`    - ${p.privilege_type} on ${p.table_name}`));
      } else {
        console.log('⚠️ No permissions found for authenticated users');
      }
    } catch (error) {
      console.log(`⚠️ Could not check permissions: ${error.message}`);
    }
    
    client.release();
    console.log('\n🎉 Credits system verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyCreditsSystem();
