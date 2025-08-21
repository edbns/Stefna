import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkPublicSchema() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔍 Checking public schema tables...');
    
    // Check if there are duplicate tables between app and public schemas
    console.log('\n📋 Checking for duplicate tables:');
    const duplicateTables = await sql`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_name IN ('credits_ledger', 'user_credits', 'app_config')
      ORDER BY table_name, table_schema
    `;
    
    duplicateTables.forEach(table => {
      console.log(`  - ${table.table_name} in ${table.table_schema} schema`);
    });
    
    // Check public.credits_ledger structure
    console.log('\n📋 public.credits_ledger table structure:');
    try {
      const publicLedgerStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'credits_ledger'
        ORDER BY ordinal_position
      `;
      
      if (publicLedgerStructure.length === 0) {
        console.log('  No public.credits_ledger table found');
      } else {
        publicLedgerStructure.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
        });
      }
    } catch (error) {
      console.log('  Error checking public.credits_ledger:', error.message);
    }
    
    // Check public.user_credits structure
    console.log('\n📋 public.user_credits table structure:');
    try {
      const publicCreditsStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_credits'
        ORDER BY ordinal_position
      `;
      
      if (publicCreditsStructure.length === 0) {
        console.log('  No public.user_credits table found');
      } else {
        publicCreditsStructure.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
        });
      }
    } catch (error) {
      console.log('  Error checking public.user_credits:', error.message);
    }
    
    // Check for duplicate foreign key constraints
    console.log('\n🔗 Checking for duplicate foreign key constraints:');
    const allForeignKeys = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema IN ('app', 'public')
        AND tc.table_name IN ('credits_ledger', 'user_credits')
      ORDER BY tc.table_schema, tc.table_name, kcu.column_name
    `;
    
    if (allForeignKeys.length === 0) {
      console.log('  No foreign key constraints found');
    } else {
      allForeignKeys.forEach(fk => {
        console.log(`  - ${fk.table_schema}.${fk.table_name}.${fk.column_name} → ${fk.foreign_table_schema}.${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking public schema:', error);
  }
}

checkPublicSchema();
