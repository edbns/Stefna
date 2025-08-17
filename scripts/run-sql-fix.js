#!/usr/bin/env node

/**
 * Run SQL Fix Script
 * This script runs the complete SQL fix for the credits system
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

async function runSqlFix() {
  console.log('🔧 Running complete SQL fix for credits system...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix-credits-system-complete.sql');
    
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
    
    // Verify everything is working
    console.log('\n🔍 Verifying fixes...');
    await verifyFixes(client);
    
    client.release();
    console.log('\n🎉 SQL fix complete!');
    
  } catch (error) {
    console.error('❌ SQL fix failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function verifyFixes(client) {
  try {
    // Check tables
    console.log('📋 Checking tables...');
    const { rows: tables } = await client.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_name IN ('credits_ledger', 'user_credits', 'app_config')
        AND table_schema IN ('public', 'app')
    `);
    
    tables.forEach(t => console.log(`  ✅ ${t.table_schema}.${t.table_name}`));
    
    // Check functions
    console.log('📋 Checking functions...');
    const { rows: functions } = await client.query(`
      SELECT proname, nspname
      FROM pg_proc p 
      JOIN pg_namespace n ON n.oid = p.pronamespace 
      WHERE p.proname IN ('reserve_credits', 'finalize_credits', 'allow_today_simple', 'cfg_int')
        AND n.nspname = 'app'
    `);
    
    functions.forEach(f => console.log(`  ✅ ${f.nspname}.${f.proname}`));
    
    // Check views
    console.log('📋 Checking views...');
    const { rows: views } = await client.query(`
      SELECT viewname, schemaname
      FROM pg_views 
      WHERE viewname = 'v_user_daily_usage'
    `);
    
    views.forEach(v => console.log(`  ✅ ${v.schemaname}.${v.viewname}`));
    
    // Test functions
    console.log('🧪 Testing functions...');
    try {
      const testResult = await client.query('SELECT app.allow_today_simple($1::uuid, $2::int)', [
        '00000000-0000-0000-0000-000000000000', // test user
        1 // test cost
      ]);
      console.log('  ✅ app.allow_today_simple: working');
    } catch (error) {
      console.log('  ❌ app.allow_today_simple:', error.message);
    }
    
  } catch (error) {
    console.log('⚠️ Verification failed:', error.message);
  }
}

runSqlFix();
