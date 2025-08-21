import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function testBackendCredits() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🧪 Testing backend credits system...');
    
    // Test 1: Check if functions exist
    console.log('\n📋 Testing database functions...');
    
    try {
      const testUser = '4a4e04b3-3eb9-497f-8402-ee5640737c60';
      const testRequest = crypto.randomUUID();
      
      console.log('🧪 Testing with user:', testUser);
      console.log('🧪 Test request ID:', testRequest);
      
      // Test daily cap check
      const dailyCapResult = await sql`SELECT app.allow_today_simple(${testUser}::uuid, 2)`;
      console.log('✅ Daily cap check:', dailyCapResult[0]);
      
      // Test credit reservation
      const reserveResult = await sql`SELECT * FROM app.reserve_credits(${testUser}::uuid, ${testRequest}::uuid, 'image.gen', 2)`;
      console.log('✅ Credit reservation:', reserveResult[0]);
      
      // Test finalization
      const finalizeResult = await sql`SELECT app.finalize_credits(${testUser}::uuid, ${testRequest}::uuid, 'commit')`;
      console.log('✅ Credit finalization:', finalizeResult);
      
      // Check final state
      const finalBalance = await sql`SELECT balance FROM app.user_credits WHERE user_id = ${testUser}::uuid`;
      console.log('✅ Final balance:', finalBalance[0]?.balance);
      
      // Clean up test data
      await sql`DELETE FROM app.credits_ledger WHERE user_id = ${testUser}::uuid AND request_id = ${testRequest}::uuid`;
      
      console.log('\n🎉 Backend credits system is working!');
      
    } catch (error) {
      console.error('❌ Backend test failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testBackendCredits();
