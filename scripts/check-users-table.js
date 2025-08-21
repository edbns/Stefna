import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsersTable() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔍 Checking users table...');
    
    // Check all tables in all schemas
    const allTables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables 
      WHERE table_name LIKE '%user%'
      ORDER BY table_schema, table_name
    `;
    
    console.log('\n📋 Tables with "user" in name:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_schema}.${table.table_name}`);
    });
    
    // Check for auth schema
    const authTables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables 
      WHERE table_schema = 'auth'
      ORDER BY table_name
    `;
    
    console.log('\n📋 Tables in auth schema:');
    if (authTables.length === 0) {
      console.log('  No auth schema found');
    } else {
      authTables.forEach(table => {
        console.log(`  - ${table.table_schema}.${table.table_name}`);
      });
    }
    
    // Check for public schema user tables
    const publicUserTables = await sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%user%'
      ORDER BY table_name
    `;
    
    console.log('\n📋 User tables in public schema:');
    publicUserTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check if any of these tables have user data
    for (const table of publicUserTables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM public.${sql(table.table_name)}`;
        console.log(`  - ${table.table_name}: ${count[0]?.count || 0} rows`);
      } catch (error) {
        console.log(`  - ${table.table_name}: error checking count`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking users table:', error);
  }
}

checkUsersTable();
