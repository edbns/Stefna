#!/usr/bin/env node

/**
 * Clean Credits Functions Deployment Script
 * This script properly deploys the missing database functions
 * Handles PostgreSQL function definitions correctly
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

async function deployCreditsFunctionsClean() {
  console.log('🚀 Deploying credits functions (clean method)...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check what functions exist
    console.log('🔍 Checking existing functions...');
    const { rows: existingFunctions } = await client.query(`
      SELECT 
        n.nspname AS schema,
        p.proname AS function,
        pg_catalog.pg_get_function_arguments(p.oid) AS args
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname IN ('reserve_credits', 'finalize_credits', 'allow_today_simple', 'cfg_int', 'cfg_bool') 
        AND n.nspname = 'app'
    `);
    
    console.log('📋 Existing functions:', existingFunctions.map(f => `${f.schema}.${f.function}`));
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'database-usage-schema.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('📖 SQL file loaded, size:', sqlContent.length, 'bytes');
    
    // Execute the entire file as one transaction
    console.log('🔧 Executing SQL file as single transaction...');
    
    try {
      await client.query('BEGIN');
      
      // Execute the entire file
      await client.query(sqlContent);
      
      await client.query('COMMIT');
      console.log('✅ SQL execution successful');
      
    } catch (execError) {
      await client.query('ROLLBACK');
      console.error('❌ SQL execution failed:', execError.message);
      
      // Try individual functions as fallback
      console.log('🔄 Trying individual function deployment...');
      await deployIndividualFunctions(client);
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
      WHERE p.proname IN ('reserve_credits', 'finalize_credits', 'allow_today_simple', 'cfg_int', 'cfg_bool') 
        AND n.nspname = 'app'
    `);
    
    console.log('✅ Functions after deployment:', newFunctions.map(f => `${f.schema}.${f.function}`));
    
    // Test the allow_today_simple function
    console.log('🧪 Testing allow_today_simple function...');
    try {
      const testResult = await client.query('SELECT app.allow_today_simple($1::uuid, $2::int)', [
        '00000000-0000-0000-0000-000000000000', // test user
        1 // test cost
      ]);
      console.log('✅ allow_today_simple test successful:', testResult.rows[0]);
    } catch (testError) {
      console.log('⚠️ allow_today_simple test result:', testError.message);
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

async function deployIndividualFunctions(client) {
  console.log('🔧 Deploying individual functions...');
  
  // Individual function definitions
  const functions = [
    {
      name: 'app.cfg_int',
      sql: `
        CREATE OR REPLACE FUNCTION app.cfg_int(p_key text, p_default int)
        RETURNS int AS $$
        DECLARE v jsonb; n int;
        BEGIN
          SELECT value INTO v FROM app_config WHERE key = p_key;
          IF v IS NULL THEN RETURN p_default; END IF;
          SELECT (v::text)::int INTO n;
          RETURN n;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'app.allow_today_simple',
      sql: `
        CREATE OR REPLACE FUNCTION app.allow_today_simple(p_user uuid, p_cost int)
        RETURNS boolean AS $$
        DECLARE spent_today int := 0;
        DECLARE cap int := app.cfg_int('daily_cap', 30);
        BEGIN
          SELECT coalesce(v.credits_spent,0)
            INTO spent_today
          FROM v_user_daily_usage v
          WHERE v.user_id = p_user
            AND v.usage_date = (now() AT TIME ZONE 'UTC')::date;
          RETURN (spent_today + p_cost) <= cap;
        END;
        $$ LANGUAGE plpgsql;
      `
    }
  ];
  
  for (const func of functions) {
    try {
      console.log(`📝 Deploying ${func.name}...`);
      await client.query(func.sql);
      console.log(`✅ ${func.name} deployed successfully`);
    } catch (error) {
      console.warn(`⚠️ ${func.name} deployment failed:`, error.message);
    }
  }
}

deployCreditsFunctionsClean();
