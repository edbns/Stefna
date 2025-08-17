#!/usr/bin/env node

/**
 * Check Function Definition Script
 * This script shows the current definition of the allow_today_simple function
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkFunctionDefinition() {
  console.log('🔍 Checking allow_today_simple function definition...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Get the function definition
    const { rows: funcDef } = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'allow_today_simple' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')
    `);
    
    if (funcDef.length > 0) {
      console.log('📋 Function definition:');
      console.log(funcDef[0].definition);
    } else {
      console.log('❌ Function not found');
    }
    
    client.release();
    console.log('\n🎉 Function definition check complete!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkFunctionDefinition();
