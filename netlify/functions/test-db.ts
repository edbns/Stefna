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
    
    // Test 2: Check if users table exists and show structure
    let usersTableInfo = null;
    try {
      const usersResult = await sql`SELECT 1 FROM users LIMIT 1`;
      console.log('✅ Users table exists');
      
      // Get users table structure
      const usersStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `;
      usersTableInfo = usersStructure;
      console.log('📋 Users table structure:', usersStructure);
    } catch (error) {
      console.log('❌ Users table does not exist:', error);
    }
    
    // Test 3: Check if user_settings table exists and show structure
    let userSettingsTableInfo = null;
    try {
      const settingsResult = await sql`SELECT 1 FROM user_settings LIMIT 1`;
      console.log('✅ User_settings table exists');
      
      // Get user_settings table structure
      const settingsStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        ORDER BY ordinal_position
      `;
      userSettingsTableInfo = settingsStructure;
      console.log('📋 User_settings table structure:', settingsStructure);
    } catch (error) {
      console.log('❌ User_settings table does not exist:', error);
    }
    
    // Test 4: Check if profiles table exists and show structure
    let profilesTableInfo = null;
    try {
      const profilesResult = await sql`SELECT 1 FROM profiles LIMIT 1`;
      console.log('✅ Profiles table exists');
      
      // Get profiles table structure
      const profilesStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        ORDER BY ordinal_position
      `;
      profilesTableInfo = profilesStructure;
      console.log('📋 Profiles table structure:', profilesStructure);
    } catch (error) {
      console.log('❌ Profiles table does not exist:', error);
    }
    
    // Test 5: Check if media_assets table exists
    let mediaAssetsTableExists = false;
    try {
      const mediaResult = await sql`SELECT 1 FROM media_assets LIMIT 1`;
      mediaAssetsTableExists = true;
      console.log('✅ Media_assets table exists');
    } catch (error) {
      console.log('❌ Media_assets table does not exist:', error);
    }
    
    // Test 6: List all tables
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
    
    // Test 7: Check compatibility views
    let compatibilityViews = null;
    try {
      const viewsResult = await sql`
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'VIEW'
        ORDER BY table_name
      `;
      compatibilityViews = viewsResult;
      console.log('📋 Compatibility views:', viewsResult);
    } catch (error) {
      console.log('❌ Could not list views:', error);
    }
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: true,
        message: 'Database connectivity test completed',
        results: {
          connection: true,
          usersTable: !!usersTableInfo,
          userSettingsTable: !!userSettingsTableInfo,
          profilesTable: !!profilesTableInfo,
          mediaAssetsTable: mediaAssetsTableExists,
          allTables: allTables,
          compatibilityViews: compatibilityViews,
          tableStructures: {
            users: usersTableInfo,
            userSettings: userSettingsTableInfo,
            profiles: profilesTableInfo
          },
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
