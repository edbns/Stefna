#!/usr/bin/env node

// Migration runner script for edit_media schema standardization
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.log('Please set your DATABASE_URL environment variable and try again.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Running edit_media schema standardization migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '20241221_standardize_edit_media_ids.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSql);
    console.log('✅ Successfully ran edit_media schema standardization migration');
    
    // Run verification queries
    console.log('🔍 Running verification checks...');
    
    // Check that all edit_media records have UUID IDs
    const editCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM edit_media 
      WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
    
    const totalEditCountResult = await pool.query('SELECT COUNT(*) as count FROM edit_media');
    
    const editCount = parseInt(editCountResult.rows[0].count);
    const totalEditCount = parseInt(totalEditCountResult.rows[0].count);
    
    if (editCount === totalEditCount) {
      console.log(`✅ All ${totalEditCount} edit_media records have valid UUID IDs`);
    } else {
      console.error(`❌ UUID verification failed. Expected ${totalEditCount}, got ${editCount}`);
      throw new Error('UUID verification failed');
    }
    
    // Check that likes table references are working
    const likesCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM likes 
      WHERE media_type = 'edit'
    `);
    
    const likesCount = parseInt(likesCountResult.rows[0].count);
    console.log(`✅ Found ${likesCount} edit media likes`);
    
    // Test that edit media likes are properly linked
    const linkedLikesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM likes l
      JOIN edit_media em ON l.media_id = em.id
      WHERE l.media_type = 'edit'
    `);
    
    const linkedLikesCount = parseInt(linkedLikesResult.rows[0].count);
    
    if (linkedLikesCount === likesCount) {
      console.log(`✅ All ${likesCount} edit media likes are properly linked`);
    } else {
      console.error(`❌ Like linking verification failed. Expected ${likesCount}, got ${linkedLikesCount}`);
      throw new Error('Like linking verification failed');
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - edit_media records migrated: ${totalEditCount}`);
    console.log(`   - edit media likes preserved: ${likesCount}`);
    console.log('');
    console.log('✨ Edit media likes should now work correctly!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
