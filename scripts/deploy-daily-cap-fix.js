#!/usr/bin/env node

/**
 * Deploy Daily Cap Fix Script
 * This script deploys the fixed allow_today_simple function
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function deployDailyCapFix() {
  console.log('🔧 Deploying daily cap fix...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Read the SQL fix
    const sqlPath = join(process.cwd(), 'scripts', 'fix-daily-cap-function.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Deploying fixed allow_today_simple function...');
    
    // Execute the SQL fix
    await client.query(sqlContent);
    
    console.log('✅ Function deployed successfully');
    
    // Test the fixed function
    console.log('\n🧪 Testing the fixed function...');
    const testResult = await client.query('SELECT app.allow_today_simple($1::uuid, $2::int)', [
      '00000000-0000-0000-0000-000000000000', 
      1
    ]);
    
    console.log('✅ Test result:', testResult.rows[0]);
    
    if (testResult.rows[0].allow_today_simple === true) {
      console.log('🎉 Daily cap function is now working correctly!');
    } else {
      console.log('⚠️ Function still not working correctly');
    }
    
    client.release();
    console.log('\n🎉 Daily cap fix deployment complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deployDailyCapFix();
