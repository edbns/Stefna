import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDuplicateColumns() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🧹 Cleaning up duplicate columns...');
    
    // Check current structure
    console.log('\n📋 Current structure:');
    const currentStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'credits_ledger'
      ORDER BY ordinal_position
    `;
    
    currentStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Check if we have both cost and amount columns
    const hasCost = currentStructure.some(col => col.column_name === 'cost');
    const hasAmount = currentStructure.some(col => col.column_name === 'amount');
    
    if (hasCost && hasAmount) {
      console.log('\n🔧 Both cost and amount columns exist, cleaning up...');
      
      // Copy any missing data from cost to amount
      console.log('🔧 Copying data from cost to amount...');
      await sql`UPDATE app.credits_ledger SET amount = -cost WHERE amount IS NULL AND cost IS NOT NULL`;
      console.log('✅ Data copied');
      
      // Drop the cost column
      console.log('🔧 Dropping cost column...');
      await sql`ALTER TABLE app.credits_ledger DROP COLUMN cost`;
      console.log('✅ Cost column dropped');
    }
    
    // Verify final structure
    console.log('\n📋 Final structure:');
    const finalStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'credits_ledger'
      ORDER BY ordinal_position
    `;
    
    finalStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Test the functions
    console.log('\n🧪 Testing functions...');
    try {
      const testResult = await sql`SELECT app.allow_today_simple(${crypto.randomUUID()}::uuid, 2)`;
      console.log('✅ app.allow_today_simple: working');
    } catch (error) {
      console.log('❌ app.allow_today_simple:', error.message);
    }
    
    console.log('\n🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupDuplicateColumns();
