// scripts/validate-backend-sync.js
// Validates that backend functions match the database schema

import pg from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function validateBackendSync() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔍 BACKEND-DATABASE SYNC VALIDATION\n');
    console.log('=' . repeat(60));

    // Get actual database schema
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const schema = {};
    
    for (const table of tables.rows) {
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      schema[table.table_name] = columns.rows.map(c => c.column_name);
    }

    console.log('\n📊 Current Database Schema:');
    console.log('-'.repeat(40));
    Object.entries(schema).forEach(([table, columns]) => {
      console.log(`\n${table}:`);
      columns.forEach(col => console.log(`  - ${col}`));
    });

    // Check for problematic references in backend
    console.log('\n\n🔍 Checking Backend Functions:');
    console.log('-'.repeat(40));

    const functionsDir = join(process.cwd(), 'netlify', 'functions');
    const files = await readdir(functionsDir);
    const issues = [];

    // Columns that should NOT exist
    const removedColumns = [
      'avatar_url',
      'avatarUrl', 
      'allow_remix',
      'allowRemix',
      'username',  // if you want to remove this too
      'userName'
    ];

    // Tables that should NOT be referenced
    const removedTables = [
      // Add any tables you've removed
    ];

    for (const file of files) {
      if (file.endsWith('.ts')) {
        const content = await readFile(join(functionsDir, file), 'utf-8');
        
        // Check for removed columns
        for (const col of removedColumns) {
          if (content.includes(col)) {
            const matches = content.match(new RegExp(`.*${col}.*`, 'g'));
            if (matches) {
              issues.push({
                file,
                type: 'removed_column',
                reference: col,
                occurrences: matches.length
              });
            }
          }
        }
        
        // Check for non-existent tables
        for (const tableName of removedTables) {
          if (content.includes(tableName)) {
            issues.push({
              file,
              type: 'removed_table',
              reference: tableName
            });
          }
        }
      }
    }

    if (issues.length > 0) {
      console.log('\n⚠️  SYNC ISSUES FOUND:');
      console.log('-'.repeat(40));
      
      const groupedIssues = issues.reduce((acc, issue) => {
        if (!acc[issue.file]) acc[issue.file] = [];
        acc[issue.file].push(issue);
        return acc;
      }, {});
      
      Object.entries(groupedIssues).forEach(([file, fileIssues]) => {
        console.log(`\n${file}:`);
        fileIssues.forEach(issue => {
          console.log(`  - References removed ${issue.type === 'removed_column' ? 'column' : 'table'}: ${issue.reference}`);
          if (issue.occurrences) {
            console.log(`    (${issue.occurrences} occurrences)`);
          }
        });
      });
      
      console.log('\n💡 Run cleanup-social-features.sh to fix these issues');
    } else {
      console.log('\n✅ Backend is properly synced with database!');
      console.log('   No references to removed columns or tables found.');
    }

    // Additional validation
    console.log('\n\n📋 Core Business Tables Status:');
    console.log('-'.repeat(40));
    
    const coreChecks = [
      { table: 'users', required_columns: ['id', 'email', 'created_at'] },
      { table: 'user_credits', required_columns: ['user_id', 'credits', 'balance'] },
      { table: 'user_settings', required_columns: ['user_id', 'media_upload_agreed', 'share_to_feed'] },
      { table: 'credits_ledger', required_columns: ['user_id', 'action', 'amount', 'status'] }
    ];
    
    for (const check of coreChecks) {
      const hasTable = schema[check.table];
      if (!hasTable) {
        console.log(`\n❌ Missing table: ${check.table}`);
        continue;
      }
      
      const missingCols = check.required_columns.filter(col => !schema[check.table].includes(col));
      if (missingCols.length > 0) {
        console.log(`\n⚠️  ${check.table}: Missing columns: ${missingCols.join(', ')}`);
      } else {
        console.log(`\n✅ ${check.table}: All required columns present`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Validation complete!');
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run validation
validateBackendSync().catch(console.error);
