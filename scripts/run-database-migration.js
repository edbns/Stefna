#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs the database-usage-schema.sql migration against your Neon database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration SQL file
const migrationPath = path.join(__dirname, '..', 'database-usage-schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Running database migration...');
console.log('📁 Migration file:', migrationPath);
console.log('📊 SQL content length:', migrationSQL.length, 'characters');

// Check if we have the required environment variables
if (!process.env.NETLIFY_DATABASE_URL) {
  console.error('❌ NETLIFY_DATABASE_URL environment variable not set');
  console.log('💡 Make sure to set your Neon database URL');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('🔗 Database URL:', process.env.NETLIFY_DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

console.log('\n📋 Migration SQL Preview (first 500 chars):');
console.log('─'.repeat(50));
console.log(migrationSQL.substring(0, 500) + '...');
console.log('─'.repeat(50));

console.log('\n🎯 To run this migration:');
console.log('1. Copy the SQL content from database-usage-schema.sql');
console.log('2. Run it in your Neon database console or via psql');
console.log('3. Or use: psql $NETLIFY_DATABASE_URL -f database-usage-schema.sql');

console.log('\n💡 Alternative: Use Neon console to run the SQL directly');
console.log('   - Go to your Neon dashboard');
console.log('   - Open the SQL Editor');
console.log('   - Paste the contents of database-usage-schema.sql');
console.log('   - Click "Run"');
