#!/usr/bin/env node

// Check the current structure of the assets table
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ NETLIFY_DATABASE_URL environment variable not set');
  console.log('Please set it to your Neon database connection string');
  process.exit(1);
}

async function checkAssetsTable() {
  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔍 Checking assets table structure...\n');
    
    // Check if assets table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assets'
      );
    `;
    
    if (!tableExists[0]?.exists) {
      console.log('❌ Assets table does not exist!');
      return;
    }
    
    console.log('✅ Assets table exists\n');
    
    // Get all columns in the assets table
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'assets' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Current columns in assets table:');
    console.log('─'.repeat(80));
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${nullable.padEnd(8)} | ${defaultVal}`);
    });
    console.log('─'.repeat(80));
    
    // Check for specific required columns
    const requiredColumns = ['final_url', 'meta', 'prompt', 'status'];
    const missingColumns = requiredColumns.filter(col => 
      !columns.find(c => c.column_name === col)
    );
    
    if (missingColumns.length > 0) {
      console.log(`\n❌ Missing required columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('\n✅ All required columns are present');
    }
    
    // Check sample data
    console.log('\n🔍 Checking sample data...');
    const sampleData = await sql`
      SELECT 
        id,
        user_id,
        cloudinary_public_id,
        final_url,
        status,
        prompt,
        meta,
        created_at,
        updated_at
      FROM public.assets 
      LIMIT 3;
    `;
    
    if (sampleData.length > 0) {
      console.log(`\n📊 Sample assets (${sampleData.length} records):`);
      sampleData.forEach((asset, index) => {
        console.log(`\nAsset ${index + 1}:`);
        console.log(`  ID: ${asset.id}`);
        console.log(`  User: ${asset.user_id}`);
        console.log(`  Cloudinary: ${asset.cloudinary_public_id || 'NULL'}`);
        console.log(`  Final URL: ${asset.final_url || 'NULL'}`);
        console.log(`  Status: ${asset.status || 'NULL'}`);
        console.log(`  Prompt: ${asset.prompt ? asset.prompt.substring(0, 50) + '...' : 'NULL'}`);
        console.log(`  Meta: ${asset.meta ? JSON.stringify(asset.meta).substring(0, 100) + '...' : 'NULL'}`);
        console.log(`  Created: ${asset.created_at}`);
        console.log(`  Updated: ${asset.updated_at}`);
      });
    } else {
      console.log('\n📊 No assets found in the table');
    }
    
    // Check total count
    const totalCount = await sql`SELECT COUNT(*) as count FROM public.assets;`;
    console.log(`\n📈 Total assets in table: ${totalCount[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Error checking assets table:', error);
  }
}

checkAssetsTable().catch(console.error);
