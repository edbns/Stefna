import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function verifyAppSchema() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔍 Verifying app schema token system...');
    
    // Check required tables
    console.log('\n📋 Checking required tables...');
    
    // Check app.credits_ledger
    try {
      const ledgerExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'app' AND table_name = 'credits_ledger'
        ) as exists
      `;
      
      if (ledgerExists[0]?.exists) {
        const count = await sql`SELECT COUNT(*) as count FROM app.credits_ledger`;
        console.log(`  ✅ app.credits_ledger: exists with ${count[0]?.count || 0} rows`);
      } else {
        console.log('  ❌ app.credits_ledger: missing');
      }
    } catch (error) {
      console.log(`  ❌ app.credits_ledger: error - ${error.message}`);
    }
    
    // Check app.user_credits
    try {
      const creditsExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'app' AND table_name = 'user_credits'
        ) as exists
      `;
      
      if (creditsExists[0]?.exists) {
        const count = await sql`SELECT COUNT(*) as count FROM app.user_credits`;
        console.log(`  ✅ app.user_credits: exists with ${count[0]?.count || 0} rows`);
      } else {
        console.log('  ❌ app.user_credits: missing');
      }
    } catch (error) {
      console.log(`  ❌ app.user_credits: error - ${error.message}`);
    }
    
    // Check app.app_config
    try {
      const configExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'app' AND table_name = 'app_config'
        ) as exists
      `;
      
      if (configExists[0]?.exists) {
        const count = await sql`SELECT COUNT(*) as count FROM app.app_config`;
        console.log(`  ✅ app.app_config: exists with ${count[0]?.count || 0} rows`);
      } else {
        console.log('  ❌ app.app_config: missing');
      }
    } catch (error) {
      console.log(`  ❌ app.app_config: error - ${error.message}`);
    }
    
    // Check required functions
    console.log('\n📋 Checking required functions...');
    
    const functions = [
      'app.reserve_credits',
      'app.finalize_credits',
      'app.allow_today_simple',
      'app.cfg_int'
    ];
    
    for (const func of functions) {
      try {
        const [schema, name] = func.split('.');
        const exists = await sql`
          SELECT EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON n.oid = p.pronamespace 
            WHERE p.proname = ${name} AND n.nspname = ${schema}
          ) as exists
        `;
        
        if (exists[0]?.exists) {
          console.log(`  ✅ ${func}: exists`);
        } else {
          console.log(`  ❌ ${func}: missing`);
        }
      } catch (error) {
        console.log(`  ❌ ${func}: error - ${error.message}`);
      }
    }
    
    // Check required views
    console.log('\n📋 Checking required views...');
    
    try {
      const viewExists = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.views 
          WHERE table_schema = 'app' AND table_name = 'v_user_daily_usage'
        ) as exists
      `;
      
      if (viewExists[0]?.exists) {
        console.log('  ✅ app.v_user_daily_usage: exists');
      } else {
        console.log('  ❌ app.v_user_daily_usage: missing');
      }
    } catch (error) {
      console.log(`  ❌ v_user_daily_usage: error - ${error.message}`);
    }
    
    // Test the complete flow
    console.log('\n🧪 Testing complete credit reservation flow...');
    
    // Test daily cap check
    try {
      const testUser = crypto.randomUUID();
      const testResult = await sql`SELECT app.allow_today_simple(${testUser}::uuid, 2)`;
      console.log('  ✅ Daily cap check: working');
    } catch (error) {
      console.log('  ❌ Daily cap check:', error.message);
    }
    
    // Test credit reservation
    try {
      // Get a real user ID
      const realUser = await sql`SELECT user_id FROM app.user_credits LIMIT 1`;
      
      if (realUser.length > 0) {
        const testUser = realUser[0].user_id;
        const testRequest = crypto.randomUUID();
        
        console.log(`  🧪 Testing with real user: ${testUser}`);
        
        // Test reservation
        const reserveResult = await sql`SELECT * FROM app.reserve_credits(${testUser}::uuid, ${testRequest}::uuid, 'image.gen', 2)`;
        console.log('  ✅ Credit reservation: working');
        
        // Test finalization
        await sql`SELECT app.finalize_credits(${testUser}::uuid, ${testRequest}::uuid, 'commit')`;
        console.log('  ✅ Credit finalization: working');
        
        // Clean up test data
        await sql`DELETE FROM app.credits_ledger WHERE user_id = ${testUser}::uuid AND request_id = ${testRequest}::uuid`;
        
      } else {
        console.log('  ⚠️ No users found to test with');
      }
      
    } catch (error) {
      console.log('  ❌ Credit reservation:', error.message);
    }
    
    console.log('\n🎉 App schema verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

verifyAppSchema();
