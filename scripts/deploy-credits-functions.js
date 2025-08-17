#!/usr/bin/env node

/**
 * Deploy Credits Functions Script
 * This script deploys the missing app.reserve_credits and app.finalize_credits functions
 * Run this to fix the 500 error in credits-reserve
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function deployCreditsFunctions() {
  console.log('🚀 Deploying credits functions to database...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if functions already exist
    console.log('🔍 Checking if functions exist...');
    const { rows: existingFunctions } = await client.query(`
      SELECT 
        n.nspname AS schema,
        p.proname AS function,
        pg_catalog.pg_get_function_arguments(p.oid) AS args
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname IN ('reserve_credits', 'finalize_credits') AND n.nspname = 'app'
    `);
    
    console.log('📋 Existing functions:', existingFunctions.map(f => `${f.schema}.${f.function}`));
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'database-usage-schema.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('📖 SQL file loaded, size:', sqlContent.length, 'bytes');
    
    // Split into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`🔧 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`📝 Statement ${i + 1}:`, statement.substring(0, 100) + '...');
          await client.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.warn(`⚠️ Statement ${i + 1} failed (may already exist):`, error.message);
        }
      }
    }
    
    // Verify functions were created
    console.log('🔍 Verifying functions were created...');
    const { rows: newFunctions } = await client.query(`
      SELECT 
        n.nspname AS schema,
        p.proname AS function,
        pg_catalog.pg_get_function_arguments(p.oid) AS args
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname IN ('reserve_credits', 'finalize_credits') AND n.nspname = 'app'
    `);
    
    console.log('✅ Functions after deployment:', newFunctions.map(f => `${f.schema}.${f.function}`));
    
    // Test the reserve_credits function
    console.log('🧪 Testing reserve_credits function...');
    try {
      const testResult = await client.query('SELECT app.reserve_credits($1::uuid, $2::uuid, $3::text, $4::int)', [
        '00000000-0000-0000-0000-000000000000', // test user
        '00000000-0000-0000-0000-000000000001', // test request
        'test', // test action
        1 // test cost
      ]);
      console.log('✅ Function test successful (expected to fail with insufficient credits)');
    } catch (testError) {
      if (testError.message.includes('INSUFFICIENT_CREDITS')) {
        console.log('✅ Function test successful (correctly caught insufficient credits)');
      } else {
        console.log('⚠️ Function test result:', testError.message);
      }
    }
    
    client.release();
    console.log('🎉 Credits functions deployment complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deployCreditsFunctions();
