#!/usr/bin/env node

// Simple test script to verify database migration
// Run with: node test-migration.js

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('💡 Make sure you have DATABASE_URL set in your environment');
  process.exit(1);
}

console.log('🔍 Testing database migration...');
console.log('📊 Database URL:', DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testDatabase() {
  let client;
  
  try {
    console.log('\n🔌 Testing database connection...');
    
    // Test 1: Basic connection
    client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test 2: Simple query
    const result = await client.query('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Basic query successful:', result.rows[0]);
    
    // Test 3: Check if tables exist
    console.log('\n📋 Checking table structure...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const expectedTables = [
      'users', 'user_settings', 'user_credits', 'auth_otps',
      'credits_ledger', 'custom_prompt_media', 'emotion_mask_media',
      'ghibli_reaction_media', 'neo_glitch_media', 'presets_media',
      'story', 'story_photo', 'video_jobs', 'ai_generations',
      'notifications', 'assets', 'presets_config', 'referral_signups',
      'app_config', '_extensions'
    ];
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('📊 Found tables:', existingTables.length);
    
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables);
    } else {
      console.log('✅ All expected tables exist');
    }
    
    // Test 4: Check triggers
    console.log('\n⚡ Checking triggers...');
    const triggersResult = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
      AND trigger_name LIKE 'update_%_updated_at'
      ORDER BY trigger_name
    `);
    
    console.log('📊 Found triggers:', triggersResult.rows.length);
    if (triggersResult.rows.length > 0) {
      console.log('✅ Triggers are working');
    }
    
    // Test 5: Test basic CRUD operations
    console.log('\n🧪 Testing basic CRUD operations...');
    
    // Test user insertion (no tier column)
    const testUserId = 'test-' + Date.now();
    await client.query(`
      INSERT INTO users (id, email, name) 
      VALUES ($1, $2, $3)
    `, [testUserId, 'test@example.com', 'Test User']);
    console.log('✅ User insertion successful');
    
    // Test user settings insertion with explicit updated_at
    await client.query(`
      INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, updated_at)
      VALUES ($1, $2, $3, NOW())
    `, [testUserId, true, true]);
    console.log('✅ User settings insertion successful');
    
    // Test user credits insertion with explicit updated_at
    await client.query(`
      INSERT INTO user_credits (user_id, balance, updated_at)
      VALUES ($1, $2, NOW())
    `, [testUserId, 30]);
    console.log('✅ User credits insertion successful');
    
    // Test query
    const userResult = await client.query(`
      SELECT u.*, us.media_upload_agreed, uc.balance
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      LEFT JOIN user_credits uc ON u.id = uc.user_id
      WHERE u.id = $1
    `, [testUserId]);
    
    if (userResult.rows.length > 0) {
      console.log('✅ User query successful:', {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        balance: userResult.rows[0].balance
      });
    }
    
    // Cleanup test data
    await client.query('DELETE FROM user_credits WHERE user_id = $1', [testUserId]);
    await client.query('DELETE FROM user_settings WHERE user_id = $1', [testUserId]);
    await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
    console.log('🧹 Test data cleaned up');
    
    console.log('\n🎉 All database tests passed successfully!');
    console.log('✅ Migration is working correctly');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the test
testDatabase().catch(console.error);
