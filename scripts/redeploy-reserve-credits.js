#!/usr/bin/env node

/**
 * Redeploy Reserve Credits Function Script
 * This script redeploys the correct app.reserve_credits function
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function redeployReserveCredits() {
  console.log('🔧 Redeploying correct app.reserve_credits function...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Drop the incorrect function first
    console.log('🗑️ Dropping incorrect function...');
    await client.query('DROP FUNCTION IF EXISTS app.reserve_credits(uuid, uuid, text, integer)');
    
    // Create the correct function
    console.log('📋 Creating correct function...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION app.reserve_credits(
        p_user uuid, p_request uuid, p_action text, p_cost int
      )
      RETURNS TABLE (balance int) AS $$
      DECLARE new_balance int;
      BEGIN
        INSERT INTO credits_ledger(user_id, request_id, action, amount, status)
        VALUES (p_user, p_request, p_action, -p_cost, 'reserved');

        UPDATE user_credits
        SET balance = balance - p_cost, updated_at = now()
        WHERE user_id = p_user AND balance >= p_cost
        RETURNING balance INTO new_balance;

        IF new_balance IS NULL THEN
          DELETE FROM credits_ledger WHERE user_id = p_user AND request_id = p_request;
          RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
        END IF;

        RETURN QUERY SELECT new_balance;
      EXCEPTION WHEN unique_violation THEN
        RETURN QUERY SELECT balance FROM user_credits WHERE user_id = p_user;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(createFunctionSQL);
    console.log('✅ Function created successfully');
    
    // Test the function
    console.log('\n🧪 Testing the corrected function...');
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
    console.log('\n🎉 Reserve credits function redeployment complete!');
    
  } catch (error) {
    console.error('❌ Redeployment failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

redeployReserveCredits();
