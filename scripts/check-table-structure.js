import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkTableStructure() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔍 Checking table structure details...');
    
    // Check credits_ledger structure
    console.log('\n📋 credits_ledger table structure:');
    const ledgerStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'credits_ledger'
      ORDER BY ordinal_position
    `;
    
    ledgerStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Check user_credits structure
    console.log('\n📋 user_credits table structure:');
    const creditsStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'user_credits'
      ORDER BY ordinal_position
    `;
    
    creditsStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Check for foreign key constraints
    console.log('\n🔗 Foreign key constraints:');
    const foreignKeys = await sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'app'
      ORDER BY tc.table_name, kcu.column_name
    `;
    
    if (foreignKeys.length === 0) {
      console.log('  No foreign key constraints found');
    } else {
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // Check if v_user_daily_usage view exists
    console.log('\n👁️ Checking v_user_daily_usage view:');
    const viewExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'app' AND table_name = 'v_user_daily_usage'
      ) as exists
    `;
    
    if (viewExists[0]?.exists) {
      console.log('  ✅ v_user_daily_usage view exists');
    } else {
      console.log('  ❌ v_user_daily_usage view missing');
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

checkTableStructure();
