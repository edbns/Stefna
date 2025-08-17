#!/usr/bin/env node

/**
 * Deploy Missing View Script
 * This script deploys the missing v_user_daily_usage view
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function deployMissingView() {
  console.log('🚀 Deploying missing view...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if view exists
    console.log('🔍 Checking if v_user_daily_usage view exists...');
    const { rows: existingViews } = await client.query(`
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE viewname = 'v_user_daily_usage'
    `);
    
    if (existingViews.length > 0) {
      console.log('✅ View already exists:', existingViews[0]);
    } else {
      console.log('❌ View does not exist, creating it...');
      
      // Create the view
      const createViewSQL = `
        CREATE OR REPLACE VIEW v_user_daily_usage AS
        SELECT
          user_id,
          (created_at AT TIME ZONE 'UTC')::date AS usage_date,
          -SUM(amount) AS credits_spent
        FROM credits_ledger
        WHERE amount < 0 AND status = 'committed'
        GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;
      `;
      
      await client.query(createViewSQL);
      console.log('✅ View created successfully');
    }
    
    // Test the allow_today_simple function again
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
    console.log('🎉 Missing view deployment complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deployMissingView();
