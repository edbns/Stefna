#!/usr/bin/env node

/**
 * Debug Daily Cap Issue Script
 * This script investigates why new accounts are hitting the daily cap
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugDailyCap() {
  console.log('🔍 Debugging daily cap issue...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check the daily usage view
    console.log('\n🔍 Checking v_user_daily_usage view...');
    try {
      const { rows: dailyUsage } = await client.query('SELECT * FROM v_user_daily_usage LIMIT 10');
      console.log('📊 Daily usage view has', dailyUsage.length, 'rows:');
      dailyUsage.forEach(row => {
        console.log(`  - User: ${row.user_id}, Date: ${row.usage_date}, Spent: ${row.credits_spent}`);
      });
    } catch (error) {
      console.log('❌ Daily usage view error:', error.message);
    }
    
    // Check the view definition
    console.log('\n🔍 Checking v_user_daily_usage view definition...');
    try {
      const { rows: viewDef } = await client.query(`
        SELECT view_definition 
        FROM information_schema.views 
        WHERE table_name = 'v_user_daily_usage'
      `);
      console.log('📋 View definition:', viewDef[0]?.view_definition);
    } catch (error) {
      console.log('❌ View definition error:', error.message);
    }
    
    // Check credits_ledger for today
    console.log('\n🔍 Checking credits_ledger for today...');
    try {
      const { rows: todayLedger } = await client.query(`
        SELECT user_id, action, amount, status, created_at
        FROM credits_ledger 
        WHERE DATE(created_at AT TIME ZONE 'UTC') = (now() AT TIME ZONE 'UTC')::date
        ORDER BY created_at DESC
        LIMIT 10
      `);
      console.log('📊 Today\'s ledger entries:', todayLedger.length);
      todayLedger.forEach(row => {
        console.log(`  - User: ${row.user_id}, Action: ${row.action}, Amount: ${row.amount}, Status: ${row.status}`);
      });
    } catch (error) {
      console.log('❌ Ledger query error:', error.message);
    }
    
    // Test the allow_today_simple function with a test user
    console.log('\n🧪 Testing allow_today_simple function...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testResult = await client.query('SELECT app.allow_today_simple($1::uuid, $2::int)', [testUserId, 1]);
      console.log('✅ allow_today_simple test result:', testResult.rows[0]);
    } catch (error) {
      console.log('❌ allow_today_simple test error:', error.message);
    }
    
    // Check if there are any global daily limits
    console.log('\n🔍 Checking for global daily limits...');
    try {
      const { rows: globalUsage } = await client.query(`
        SELECT 
          DATE(created_at AT TIME ZONE 'UTC') as usage_date,
          COUNT(*) as total_requests,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_credits_used
        FROM credits_ledger 
        WHERE DATE(created_at AT TIME ZONE 'UTC') = (now() AT TIME ZONE 'UTC')::date
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      `);
      console.log('📊 Global daily usage:', globalUsage);
    } catch (error) {
      console.log('❌ Global usage query error:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Daily cap debugging complete!');
    
  } catch (error) {
    console.error('❌ Debugging failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

debugDailyCap();
