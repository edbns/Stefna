#!/usr/bin/env node

/**
 * Test Real User Script
 * This script tests the fixed app.reserve_credits function with the real user
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use the production database URL
const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testRealUser() {
  console.log('🧪 Testing fixed function with real user...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test with the real user ID that was failing
    const realUserId = '5f4783f5-4766-44e1-9c2b-cb065c4300ff';
    const realRequestId = '00000000-0000-0000-0000-000000000000';
    const realAction = 'emotionmask';
    const realCost = 1;
    
    console.log(`🔍 Testing with user: ${realUserId}`);
    console.log(`🔍 Action: ${realAction}, Cost: ${realCost}`);
    
    // Test the function
    const result = await client.query(`
      SELECT * FROM app.reserve_credits($1::uuid, $2::uuid, $3::text, $4::int)
    `, [realUserId, realRequestId, realAction, realCost]);
    
    console.log('✅ Function execution successful!');
    console.log('✅ Result:', result.rows);
    console.log('✅ Row count:', result.rowCount);
    console.log('✅ Column names:', result.fields?.map(f => f.name));
    
    if (result.rows.length > 0 && result.fields[0].name === 'balance') {
      console.log('🎉 Function is working perfectly with real user!');
      console.log(`💰 New balance: ${result.rows[0].balance}`);
    } else {
      console.log('⚠️ Function returned unexpected result');
    }
    
    client.release();
    console.log('\n🎉 Real user test complete!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    // Check if it's an expected error (like insufficient credits)
    if (error.message.includes('INSUFFICIENT_CREDITS')) {
      console.log('✅ Expected error - user has no credits');
    } else {
      console.log('❌ Unexpected error - function still has issues');
    }
  } finally {
    await pool.end();
  }
}

testRealUser();
