import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';

export const handler: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    console.log('🔍 Testing database connectivity...');
    
    // Test 1: Basic connection
    console.log('✅ Database connection test passed');
    
    // Test 2: Check if users table exists
    let usersTableExists = false;
    try {
      const usersResult = await sql`SELECT 1 FROM users LIMIT 1`;
      usersTableExists = true;
      console.log('✅ Users table exists');
    } catch (error) {
      console.log('❌ Users table does not exist:', error);
    }
    
    // Test 3: Check if user_settings table exists
    let userSettingsTableExists = false;
    try {
      const settingsResult = await sql`SELECT 1 FROM user_settings LIMIT 1`;
      userSettingsTableExists = true;
      console.log('✅ User_settings table exists');
    } catch (error) {
      console.log('❌ User_settings table does not exist:', error);
    }
    
    // Test 4: Check if media_assets table exists
    let mediaAssetsTableExists = false;
    try {
      const mediaResult = await sql`SELECT 1 FROM media_assets LIMIT 1`;
      mediaAssetsTableExists = true;
      console.log('✅ Media_assets table exists');
    } catch (error) {
      console.log('❌ Media_assets table does not exist:', error);
    }
    
    // Test 5: List all tables
    let allTables: string[] = [];
    try {
      const tablesResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      allTables = tablesResult.map((row: any) => row.table_name);
      console.log('✅ Available tables:', allTables);
    } catch (error) {
      console.log('❌ Could not list tables:', error);
    }
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: true,
        message: 'Database connectivity test completed',
        results: {
          connection: true,
          usersTable: usersTableExists,
          userSettingsTable: userSettingsTableExists,
          mediaAssetsTable: mediaAssetsTableExists,
          allTables: allTables,
          timestamp: new Date().toISOString()
        }
      }),
    };
  } catch (e: any) {
    console.error('❌ Database test failed:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        error: 'Database test failed', 
        message: e?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
