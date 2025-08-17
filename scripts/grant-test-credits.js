#!/usr/bin/env node

/**
 * Grant Test Credits Script
 * This script grants credits to the test user so they can test generation
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use the production database URL
const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function grantTestCredits() {
  console.log('💰 Granting test credits to user...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    const userId = '5f4783f5-4766-44e1-9c2b-cb065c4300ff';
    const creditsToGrant = 10;
    
    console.log(`🔍 Granting ${creditsToGrant} credits to user: ${userId}`);
    
    // Grant credits using the app.grant_credits function
    await client.query(`
      SELECT app.grant_credits($1::uuid, $2::int, $3::text, $4::jsonb)
    `, [userId, creditsToGrant, 'test_grant', '{"reason": "testing generation flow"}']);
    
    console.log('✅ Credits granted successfully');
    
    // Check the new balance
    const { rows: balanceResult } = await client.query(`
      SELECT balance FROM user_credits WHERE user_id = $1::uuid
    `, [userId]);
    
    if (balanceResult.length > 0) {
      console.log(`💰 New balance: ${balanceResult[0].balance}`);
    } else {
      console.log('⚠️ Could not retrieve balance');
    }
    
    client.release();
    console.log('\n🎉 Test credits granted!');
    
  } catch (error) {
    console.error('❌ Failed to grant credits:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

grantTestCredits();
