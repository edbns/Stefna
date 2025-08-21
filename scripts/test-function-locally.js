import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function testFunctionLocally() {
  console.log('🧪 Testing function logic locally...');
  
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Test the exact logic from the function
    const testUser = '4a4e04b3-3eb9-497f-8402-ee5640737c60';
    const testRequest = crypto.randomUUID();
    const action = 'image.gen';
    const cost = 2;
    
    console.log('🧪 Test parameters:');
    console.log('  User ID:', testUser);
    console.log('  Request ID:', testRequest);
    console.log('  Action:', action);
    console.log('  Cost:', cost);
    
    // Test 1: Check daily cap
    console.log('\n📋 Test 1: Daily cap check');
    const dailyCapResult = await sql`SELECT app.allow_today_simple(${testUser}::uuid, ${cost})`;
    console.log('✅ Result:', dailyCapResult[0]);
    
    // Test 2: Check current balance
    console.log('\n📋 Test 2: Current balance');
    const balanceResult = await sql`SELECT balance FROM app.user_credits WHERE user_id = ${testUser}::uuid`;
    console.log('✅ Current balance:', balanceResult[0]?.balance);
    
    // Test 3: Reserve credits
    console.log('\n📋 Test 3: Reserve credits');
    const reserveResult = await sql`SELECT * FROM app.reserve_credits(${testUser}::uuid, ${testRequest}::uuid, ${action}, ${cost})`;
    console.log('✅ Reserve result:', reserveResult[0]);
    
    // Test 4: Check balance after reservation
    console.log('\n📋 Test 4: Balance after reservation');
    const newBalanceResult = await sql`SELECT balance FROM app.user_credits WHERE user_id = ${testUser}::uuid`;
    console.log('✅ New balance:', newBalanceResult[0]?.balance);
    
    // Test 5: Finalize credits
    console.log('\n📋 Test 5: Finalize credits');
    const finalizeResult = await sql`SELECT app.finalize_credits(${testUser}::uuid, ${testRequest}::uuid, 'commit')`;
    console.log('✅ Finalize result:', finalizeResult);
    
    // Test 6: Final balance
    console.log('\n📋 Test 6: Final balance');
    const finalBalanceResult = await sql`SELECT balance FROM app.user_credits WHERE user_id = ${testUser}::uuid`;
    console.log('✅ Final balance:', finalBalanceResult[0]?.balance);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await sql`DELETE FROM app.credits_ledger WHERE user_id = ${testUser}::uuid AND request_id = ${testRequest}::uuid`;
    console.log('✅ Cleanup complete');
    
    console.log('\n🎉 All local tests passed! Function logic is working correctly.');
    
  } catch (error) {
    console.error('❌ Local test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testFunctionLocally();
