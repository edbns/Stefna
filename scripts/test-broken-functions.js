#!/usr/bin/env node

/**
 * Test Broken Functions Script
 * This script tests the functions that are returning 500 errors
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testBrokenFunctions() {
  console.log('🧪 Testing broken functions to find root cause...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test 1: Check if users table exists
    console.log('\n🔍 Testing users table access...');
    try {
      const { rows: users } = await client.query('SELECT COUNT(*) as count FROM users');
      console.log('✅ users table exists with', users[0].count, 'rows');
    } catch (error) {
      console.log('❌ users table error:', error.message);
      
      // Check what user-related tables exist
      const { rows: userTables } = await client.query(`
        SELECT table_name, table_schema
        FROM information_schema.tables 
        WHERE table_name LIKE '%user%' OR table_name LIKE '%profile%'
        ORDER BY table_schema, table_name
      `);
      
      console.log('📋 Available user-related tables:');
      userTables.forEach(t => console.log(`  - ${t.table_schema}.${t.table_name}`));
    }
    
    // Test 2: Check app_config access
    console.log('\n🔍 Testing app_config access...');
    try {
      const { rows: config } = await client.query("SELECT key, value FROM app_config WHERE key='starter_grant'");
      console.log('✅ app_config access:', config);
    } catch (error) {
      console.log('❌ app_config error:', error.message);
    }
    
    // Test 3: Check user_credits access
    console.log('\n🔍 Testing user_credits access...');
    try {
      const { rows: credits } = await client.query('SELECT COUNT(*) as count FROM user_credits');
      console.log('✅ user_credits access:', credits[0].count, 'rows');
    } catch (error) {
      console.log('❌ user_credits error:', error.message);
    }
    
    // Test 4: Check credits_ledger access
    console.log('\n🔍 Testing credits_ledger access...');
    try {
      const { rows: ledger } = await client.query('SELECT COUNT(*) as count FROM credits_ledger');
      console.log('✅ credits_ledger access:', ledger[0].count, 'rows');
    } catch (error) {
      console.log('❌ credits_ledger error:', error.message);
    }
    
    // Test 5: Check user_settings access
    console.log('\n🔍 Testing user_settings access...');
    try {
      const { rows: settings } = await client.query('SELECT COUNT(*) as count FROM user_settings');
      console.log('✅ user_settings access:', settings[0].count, 'rows');
    } catch (error) {
      console.log('❌ user_settings error:', error.message);
    }
    
    // Test 6: Check environment variables
    console.log('\n🔍 Checking environment variables...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NETLIFY_DATABASE_URL exists:', !!process.env.NETLIFY_DATABASE_URL);
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    console.log('NETLIFY_DATABASE_URL starts with:', process.env.NETLIFY_DATABASE_URL?.substring(0, 20) + '...');
    
    client.release();
    console.log('\n🎉 Function testing complete!');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testBrokenFunctions();
