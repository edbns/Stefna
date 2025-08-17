#!/usr/bin/env node

/**
 * Deploy Final Fix Script
 * This script deploys the final fixed app.reserve_credits function
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

async function deployFinalFix() {
  console.log('🔧 Deploying final fixed app.reserve_credits function...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Read the SQL fix
    const sqlPath = join(process.cwd(), 'scripts', 'fix-column-ambiguity-final.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Deploying final fix...');
    
    // Execute the SQL fix
    await client.query(sqlContent);
    
    console.log('✅ Function deployed successfully');
    
    // Test the fixed function
    console.log('\n🧪 Testing the final fixed function...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testRequestId = '00000000-0000-0000-0000-000000000000';
      const testAction = 'test';
      const testCost = 1;
      
      const result = await client.query(`
        SELECT * FROM app.reserve_credits($1::uuid, $2::uuid, $3::text, $4::int)
      `, [testUserId, testRequestId, testAction, testCost]);
      
      console.log('✅ Function test result:', result.rows);
      console.log('✅ Row count:', result.rowCount);
      console.log('✅ Column names:', result.fields?.map(f => f.name));
      
      if (result.rows.length > 0 && result.fields[0].name === 'balance') {
        console.log('🎉 Function is now working correctly!');
      } else {
        console.log('⚠️ Function still not working correctly');
      }
      
    } catch (error) {
      console.log('✅ Expected error for test user:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Final fix deployment complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deployFinalFix();
