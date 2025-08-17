#!/usr/bin/env node

/**
 * Debug Reserve Credits Function Script
 * This script investigates why app.reserve_credits is returning undefined
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugReserveCredits() {
  console.log('🔍 Debugging app.reserve_credits function...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test the reserve_credits function directly
    console.log('\n🧪 Testing app.reserve_credits function...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testRequestId = '00000000-0000-0000-0000-000000000000';
      const testAction = 'test';
      const testCost = 1;
      
      const result = await client.query(`
        SELECT * FROM app.reserve_credits($1::uuid, $2::uuid, $3::text, $4::int)
      `, [testUserId, testRequestId, testAction, testCost]);
      
      console.log('✅ Function result:', result.rows);
      console.log('✅ Row count:', result.rowCount);
      console.log('✅ Column names:', result.fields?.map(f => f.name));
      
    } catch (error) {
      console.log('❌ Function execution error:', error.message);
      
      // Check if the function exists
      console.log('\n🔍 Checking if function exists...');
      const { rows: funcExists } = await client.query(`
        SELECT proname, prorettype::regtype as return_type
        FROM pg_proc 
        WHERE proname = 'reserve_credits' 
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')
      `);
      
      if (funcExists.length > 0) {
        console.log('✅ Function exists:', funcExists[0]);
      } else {
        console.log('❌ Function not found');
      }
    }
    
    // Check the function definition
    console.log('\n🔍 Checking function definition...');
    try {
      const { rows: funcDef } = await client.query(`
        SELECT pg_get_functiondef(oid) as definition
        FROM pg_proc 
        WHERE proname = 'reserve_credits' 
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')
      `);
      
      if (funcDef.length > 0) {
        console.log('📋 Function definition:');
        console.log(funcDef[0].definition);
      }
    } catch (error) {
      console.log('❌ Function definition error:', error.message);
    }
    
    // Test with a real user ID (but expect it to fail due to insufficient credits)
    console.log('\n🧪 Testing with real user ID (expecting insufficient credits error)...');
    try {
      const realUserId = '5f4783f5-4766-44e1-9c2b-cb065c4300ff';
      const realRequestId = '00000000-0000-0000-0000-000000000000';
      const realAction = 'test';
      const realCost = 1;
      
      const result = await client.query(`
        SELECT * FROM app.reserve_credits($1::uuid, $2::uuid, $3::text, $4::int)
      `, [realUserId, realRequestId, realAction, realCost]);
      
      console.log('✅ Real user test result:', result.rows);
      
    } catch (error) {
      console.log('✅ Expected error for real user:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Reserve credits debugging complete!');
    
  } catch (error) {
    console.error('❌ Debugging failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

debugReserveCredits();
