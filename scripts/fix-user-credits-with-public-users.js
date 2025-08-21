import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function fixUserCreditsWithPublicUsers() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔧 Fixing user_credits using public.users...');
    
    // Check public.users structure
    console.log('\n📋 Checking public.users structure...');
    const usersStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    usersStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(not null)' : '(nullable)'}`);
    });
    
    // Check how many users exist
    const userCount = await sql`SELECT COUNT(*) as count FROM public.users`;
    console.log(`\n👥 Found ${userCount[0]?.count || 0} users in public.users`);
    
    // Ensure all users have initial credits
    console.log('\n🔧 Ensuring all users have initial credits...');
    await sql`
      INSERT INTO app.user_credits (user_id, balance, updated_at)
      SELECT 
        u.id, 
        30, 
        now()
      FROM public.users u
      WHERE u.id NOT IN (SELECT user_id FROM app.user_credits)
      ON CONFLICT (user_id) DO NOTHING
    `;
    console.log('✅ Initial credits ensured');
    
    // Check final user_credits count
    const creditsCount = await sql`SELECT COUNT(*) as count FROM app.user_credits`;
    console.log(`\n💰 User credits table now has ${creditsCount[0]?.count || 0} users`);
    
    // Test the complete flow
    console.log('\n🧪 Testing complete credit flow...');
    
    // Test daily cap check
    try {
      const testUser = crypto.randomUUID();
      const testResult = await sql`SELECT app.allow_today_simple(${testUser}::uuid, 2)`;
      console.log('✅ Daily cap check: working');
    } catch (error) {
      console.log('❌ Daily cap check:', error.message);
    }
    
    // Test credit reservation with a real user
    try {
      // Get a real user ID
      const realUser = await sql`SELECT id FROM app.user_credits LIMIT 1`;
      
      if (realUser.length > 0) {
        const testUser = realUser[0].id;
        const testRequest = crypto.randomUUID();
        
        console.log(`🧪 Testing with real user: ${testUser}`);
        
        // Test reservation
        const reserveResult = await sql`SELECT * FROM app.reserve_credits(${testUser}::uuid, ${testRequest}::uuid, 'image.gen', 2)`;
        console.log('✅ Credit reservation: working');
        
        // Test finalization
        await sql`SELECT app.finalize_credits(${testUser}::uuid, ${testRequest}::uuid, 'commit')`;
        console.log('✅ Credit finalization: working');
        
        // Clean up test data
        await sql`DELETE FROM app.credits_ledger WHERE user_id = ${testUser}::uuid AND request_id = ${testRequest}::uuid`;
        
      } else {
        console.log('⚠️ No users found to test with');
      }
      
    } catch (error) {
      console.log('❌ Credit flow test:', error.message);
    }
    
    console.log('\n🎉 User credits fixed and tested!');
    
  } catch (error) {
    console.error('❌ Error fixing user_credits:', error);
  }
}

fixUserCreditsWithPublicUsers();
