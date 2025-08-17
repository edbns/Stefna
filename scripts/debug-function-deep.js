#!/usr/bin/env node

/**
 * Deep Debug Function Script
 * This script investigates what's happening inside the allow_today_simple function
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugFunctionDeep() {
  console.log('🔍 Deep debugging allow_today_simple function...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test each part of the function step by step
    console.log('\n🔍 Step 1: Testing app.cfg_int function...');
    try {
      const capResult = await client.query("SELECT app.cfg_int('daily_cap', 30) as cap");
      console.log('✅ Daily cap value:', capResult.rows[0].cap);
    } catch (error) {
      console.log('❌ app.cfg_int error:', error.message);
    }
    
    console.log('\n🔍 Step 2: Testing the daily usage view query...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const usageResult = await client.query(`
        SELECT COALESCE(v.credits_spent, 0) as spent_today
        FROM v_user_daily_usage v
        WHERE v.user_id = $1::uuid
          AND v.usage_date = (now() AT TIME ZONE 'UTC')::date
      `, [testUserId]);
      console.log('✅ Usage query result:', usageResult.rows);
    } catch (error) {
      console.log('❌ Usage query error:', error.message);
    }
    
    console.log('\n🔍 Step 3: Testing the complete logic...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testCost = 1;
      
      // Get daily cap
      const capResult = await client.query("SELECT app.cfg_int('daily_cap', 30) as cap");
      const cap = capResult.rows[0].cap;
      
      // Get today's usage
      const usageResult = await client.query(`
        SELECT COALESCE(v.credits_spent, 0) as spent_today
        FROM v_user_daily_usage v
        WHERE v.user_id = $1::uuid
          AND v.usage_date = (now() AT TIME ZONE 'UTC')::date
      `, [testUserId]);
      const spentToday = usageResult.rows[0]?.spent_today || 0;
      
      // Calculate result
      const result = (spentToday + testCost) <= cap;
      
      console.log('✅ Manual calculation:');
      console.log(`  - Daily cap: ${cap}`);
      console.log(`  - Spent today: ${spentToday}`);
      console.log(`  - Test cost: ${testCost}`);
      console.log(`  - Result: ${result}`);
    } catch (error) {
      console.log('❌ Manual calculation error:', error.message);
    }
    
    console.log('\n🔍 Step 4: Testing the function with error handling...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testResult = await client.query(`
        SELECT 
          app.allow_today_simple($1::uuid, $2::int) as result,
          app.cfg_int('daily_cap', 30) as cap
      `, [testUserId, 1]);
      console.log('✅ Function test with cap:', testResult.rows[0]);
    } catch (error) {
      console.log('❌ Function test error:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Deep debugging complete!');
    
  } catch (error) {
    console.error('❌ Deep debugging failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

debugFunctionDeep();
