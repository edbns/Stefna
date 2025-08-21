import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkAndFixStructure() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔍 Checking current table structure...');
    
    // Check current credits_ledger structure
    console.log('\n📋 Current app.credits_ledger structure:');
    const ledgerStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'credits_ledger'
      ORDER BY ordinal_position
    `;
    
    ledgerStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Check if amount column exists
    const hasAmount = ledgerStructure.some(col => col.column_name === 'amount');
    console.log(`\n🔍 Amount column exists: ${hasAmount}`);
    
    if (!hasAmount) {
      console.log('\n🔧 Adding amount column...');
      await sql`ALTER TABLE app.credits_ledger ADD COLUMN amount integer`;
      console.log('✅ Amount column added');
      
      // Update with default values
      console.log('🔧 Setting default values...');
      await sql`UPDATE app.credits_ledger SET amount = -2 WHERE action LIKE '%image%'`;
      await sql`UPDATE app.credits_ledger SET amount = -5 WHERE action LIKE '%video%'`;
      await sql`UPDATE app.credits_ledger SET amount = -2 WHERE amount IS NULL`;
      console.log('✅ Default values set');
      
      // Make NOT NULL
      console.log('🔧 Making amount NOT NULL...');
      await sql`ALTER TABLE app.credits_ledger ALTER COLUMN amount SET NOT NULL`;
      console.log('✅ Amount column is now NOT NULL');
    }
    
    // Check if meta column exists
    const hasMeta = ledgerStructure.some(col => col.column_name === 'meta');
    if (!hasMeta) {
      console.log('\n🔧 Adding meta column...');
      await sql`ALTER TABLE app.credits_ledger ADD COLUMN meta jsonb`;
      console.log('✅ Meta column added');
    }
    
    // Create v_user_daily_usage view
    console.log('\n🔧 Creating v_user_daily_usage view...');
    await sql`
      CREATE OR REPLACE VIEW app.v_user_daily_usage AS
      SELECT
        user_id,
        (created_at AT TIME ZONE 'UTC')::date AS usage_date,
        -SUM(amount) AS credits_spent
      FROM app.credits_ledger
      WHERE amount < 0 AND status = 'committed'
      GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date
    `;
    console.log('✅ View created');
    
    // Verify final structure
    console.log('\n📋 Final app.credits_ledger structure:');
    const finalStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'credits_ledger'
      ORDER BY ordinal_position
    `;
    
    finalStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    console.log('\n🎉 Structure fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing structure:', error);
  }
}

checkAndFixStructure();
