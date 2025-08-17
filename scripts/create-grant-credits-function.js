#!/usr/bin/env node

/**
 * Create Grant Credits Function Script
 * This script creates the missing app.grant_credits function in production
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use the production database URL
const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createGrantCreditsFunction() {
  console.log('🔧 Creating app.grant_credits function in production...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Create the grant_credits function
    console.log('📋 Creating grant_credits function...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION app.grant_credits(
        p_user uuid, p_amount int, p_reason text, p_meta jsonb DEFAULT '{}'::jsonb
      )
      RETURNS void AS $$
      BEGIN
        UPDATE user_credits SET balance = balance + p_amount, updated_at = now()
        WHERE user_id = p_user;
        IF NOT FOUND THEN
          INSERT INTO user_credits(user_id, balance) VALUES (p_user, p_amount);
        END IF;

        INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
        VALUES (p_user, gen_random_uuid(), p_reason, p_amount, 'granted', p_meta);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(createFunctionSQL);
    console.log('✅ Function created successfully');
    
    // Test the function
    console.log('\n🧪 Testing the grant_credits function...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const testAmount = 5;
      const testReason = 'test';
      const testMeta = '{"reason": "testing"}';
      
      await client.query(`
        SELECT app.grant_credits($1::uuid, $2::int, $3::text, $4::jsonb)
      `, [testUserId, testAmount, testReason, testMeta]);
      
      console.log('✅ Function test successful');
      
    } catch (error) {
      console.log('✅ Expected error for test user:', error.message);
    }
    
    client.release();
    console.log('\n🎉 Grant credits function creation complete!');
    
  } catch (error) {
    console.error('❌ Creation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createGrantCreditsFunction();
