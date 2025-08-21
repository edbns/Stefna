import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function checkAndFixUserCredits() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔍 Checking user_credits table structure...');
    
    // Check current structure
    const structure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'user_credits'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Current structure:');
    structure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Check if updated_at column exists
    const hasUpdatedAt = structure.some(col => col.column_name === 'updated_at');
    
    if (!hasUpdatedAt) {
      console.log('\n🔧 Adding updated_at column...');
      await sql`ALTER TABLE app.user_credits ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now()`;
      console.log('✅ updated_at column added');
    }
    
    // Check if balance column exists
    const hasBalance = structure.some(col => col.column_name === 'balance');
    
    if (!hasBalance) {
      console.log('\n🔧 Adding balance column...');
      await sql`ALTER TABLE app.user_credits ADD COLUMN balance integer NOT NULL DEFAULT 0`;
      console.log('✅ balance column added');
    }
    
    // Verify final structure
    console.log('\n📋 Final structure:');
    const finalStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'app' AND table_name = 'user_credits'
      ORDER BY ordinal_position
    `;
    
    finalStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Ensure all users have initial credits
    console.log('\n🔧 Ensuring all users have initial credits...');
    await sql`
      INSERT INTO app.user_credits (user_id, balance, updated_at)
      SELECT 
        u.id, 
        30, 
        now()
      FROM auth.users u
      WHERE u.id NOT IN (SELECT user_id FROM app.user_credits)
      ON CONFLICT (user_id) DO NOTHING
    `;
    console.log('✅ Initial credits ensured');
    
    console.log('\n🎉 User credits table fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing user_credits:', error);
  }
}

checkAndFixUserCredits();
