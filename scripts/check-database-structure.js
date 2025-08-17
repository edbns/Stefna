#!/usr/bin/env node

/**
 * Check Database Structure Script
 * This script checks what tables and structures actually exist in the database
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check what schemas exist
    console.log('\n📋 Available schemas:');
    const { rows: schemas } = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name
    `);
    schemas.forEach(s => console.log(`  - ${s.schema_name}`));
    
    // Check what tables exist in public schema
    console.log('\n📋 Tables in public schema:');
    const { rows: publicTables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    publicTables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check what tables exist in app schema
    console.log('\n📋 Tables in app schema:');
    const { rows: appTables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'app' 
      ORDER BY table_name
    `);
    appTables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check credits_ledger table structure if it exists
    console.log('\n🔍 Checking credits_ledger table structure...');
    try {
      const { rows: ledgerColumns } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'credits_ledger' 
        ORDER BY ordinal_position
      `);
      
      if (ledgerColumns.length > 0) {
        console.log('✅ credits_ledger table exists with columns:');
        ledgerColumns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`));
      } else {
        console.log('❌ credits_ledger table does not exist');
      }
    } catch (error) {
      console.log('❌ Error checking credits_ledger:', error.message);
    }
    
    // Check user_credits table structure if it exists
    console.log('\n🔍 Checking user_credits table structure...');
    try {
      const { rows: userCreditsColumns } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'user_credits' 
        ORDER BY ordinal_position
      `);
      
      if (userCreditsColumns.length > 0) {
        console.log('✅ user_credits table exists with columns:');
        userCreditsColumns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`));
      } else {
        console.log('❌ user_credits table does not exist');
      }
    } catch (error) {
      console.log('❌ Error checking user_credits:', error.message);
    }
    
    // Check app_config table structure if it exists
    console.log('\n🔍 Checking app_config table structure...');
    try {
      const { rows: appConfigColumns } = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'app_config' 
        ORDER BY ordinal_position
      `);
      
      if (appConfigColumns.length > 0) {
        console.log('✅ app_config table exists with columns:');
        appConfigColumns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`));
        
        // Check what config values exist
        const { rows: configValues } = await client.query('SELECT key, value FROM app_config');
        if (configValues.length > 0) {
          console.log('📊 Current config values:');
          configValues.forEach(c => console.log(`  - ${c.key}: ${JSON.stringify(c.value)}`));
        } else {
          console.log('📊 No config values found');
        }
      } else {
        console.log('❌ app_config table does not exist');
      }
    } catch (error) {
      console.log('❌ Error checking app_config:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Database structure check complete!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();
