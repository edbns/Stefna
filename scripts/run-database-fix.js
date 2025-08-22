#!/usr/bin/env node

// Run Database Architecture Fix
// This script applies the consolidated database structure

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Try multiple possible environment variable names
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || 
                    process.env.DATABASE_URL || 
                    process.env.NETLIFY_DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
  console.error('❌ No database URL found in environment variables');
  console.log('Available variables:');
  console.log('- NETLIFY_DATABASE_URL:', process.env.NETLIFY_DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('- NETLIFY_DATABASE_URL_UNPOOLED:', process.env.NETLIFY_DATABASE_URL_UNPOOLED ? '✅ Set' : '❌ Not set');
  process.exit(1);
}

console.log('🔗 Using database URL:', DATABASE_URL.substring(0, 50) + '...');

async function runDatabaseFix() {
  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔧 Starting database architecture fix...\n');
    
    // Read the SQL fix script
    const sqlFixPath = path.join(process.cwd(), 'sql', 'fix-database-architecture.sql');
    const sqlFix = fs.readFileSync(sqlFixPath, 'utf8');
    
    console.log('📖 SQL fix script loaded successfully');
    console.log('📏 Script size:', sqlFix.length, 'characters\n');
    
    // Split the script into individual statements
    const statements = sqlFix
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔍 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        // Skip empty or comment-only statements
        if (statement.trim().length === 0 || statement.trim().startsWith('--')) {
          console.log('⏭️  Skipping empty/comment statement');
          continue;
        }
        
        // Execute the statement
        const result = await sql.unsafe(statement);
        console.log('✅ Statement executed successfully');
        
        if (result && result.length > 0) {
          console.log(`📊 Result: ${result.length} rows affected`);
        }
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Statement ${i + 1} failed:`, error.message);
        errorCount++;
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log('⚠️  Non-critical error, continuing...');
        } else {
          console.log('🚨 Critical error, stopping execution');
          break;
        }
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📊 Database fix execution summary:');
    console.log('─'.repeat(50));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Database architecture fix completed successfully!');
      console.log('🔍 You can now test the updated functions.');
    } else {
      console.log('\n⚠️  Some statements failed. Check the logs above for details.');
    }
    
    // Verify the new structure
    console.log('\n🔍 Verifying new database structure...');
    
    try {
      // Check if media_assets table exists
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'media_assets'
        );
      `;
      
      if (tableExists[0]?.exists) {
        console.log('✅ media_assets table exists');
        
        // Check columns
        const columns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'media_assets' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        
        console.log(`📋 media_assets table has ${columns.length} columns`);
        
        // Check for key columns
        const keyColumns = ['final_url', 'status', 'is_public', 'preset_key'];
        const missingColumns = keyColumns.filter(col => 
          !columns.find(c => c.column_name === col)
        );
        
        if (missingColumns.length === 0) {
          console.log('✅ All key columns are present');
        } else {
          console.log(`⚠️  Missing columns: ${missingColumns.join(', ')}`);
        }
        
      } else {
        console.log('❌ media_assets table does not exist');
      }
      
      // Check if credits tables exist
      const creditsTableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_credits'
        );
      `;
      
      if (creditsTableExists[0]?.exists) {
        console.log('✅ user_credits table exists');
      } else {
        console.log('❌ user_credits table does not exist');
      }
      
    } catch (error) {
      console.error('❌ Error verifying structure:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

runDatabaseFix().catch(console.error);
