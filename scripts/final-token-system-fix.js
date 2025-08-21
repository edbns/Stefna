import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function finalTokenSystemFix() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  
  try {
    console.log('🔧 Final token system fix...');
    
    // Check current state
    console.log('\n📋 Checking current state...');
    
    // Check if app.user_credits exists
    const userCreditsExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'app' AND table_name = 'user_credits'
      ) as exists
    `;
    
    if (!userCreditsExists[0]?.exists) {
      console.log('🔧 Creating app.user_credits table...');
      await sql`
        CREATE TABLE IF NOT EXISTS app.user_credits (
          user_id uuid PRIMARY KEY,
          balance integer NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      console.log('✅ app.user_credits table created');
    }
    
    // Check if app.app_config exists
    const appConfigExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'app' AND table_name = 'app_config'
      ) as exists
    `;
    
    if (!appConfigExists[0]?.exists) {
      console.log('🔧 Creating app.app_config table...');
      await sql`
        CREATE TABLE IF NOT EXISTS app.app_config (
          key text PRIMARY KEY,
          value jsonb NOT NULL
        )
      `;
      console.log('✅ app.app_config table created');
      
      // Insert default config
      console.log('🔧 Inserting default config...');
      await sql`
        INSERT INTO app.app_config(key,value) VALUES
         ('daily_cap', '30'),
         ('starter_grant', '30'),
         ('image_cost', '2'),
         ('video_cost', '5'),
         ('video_enabled', 'false'),
         ('referral_referrer_bonus', '50'),
         ('referral_new_bonus', '25')
        ON CONFLICT (key) DO NOTHING
      `;
      console.log('✅ Default config inserted');
    }
    
    // Ensure all users have initial credits
    console.log('🔧 Ensuring all users have initial credits...');
    await sql`
      INSERT INTO app.user_credits (user_id, balance, updated_at)
      SELECT 
        u.id, 
        COALESCE(uc.balance, 30), 
        COALESCE(uc.updated_at, now())
      FROM auth.users u
      LEFT JOIN app.user_credits uc ON u.id = uc.user_id
      WHERE u.id NOT IN (SELECT user_id FROM app.user_credits)
      ON CONFLICT (user_id) DO NOTHING
    `;
    console.log('✅ Initial credits ensured');
    
    // Fix foreign key constraints
    console.log('🔧 Fixing foreign key constraints...');
    
    // Drop existing constraints
    await sql`
      DO $$
      DECLARE
          constraint_record RECORD;
      BEGIN
          FOR constraint_record IN 
              SELECT conname, conrelid::regclass as table_name
              FROM pg_constraint 
              WHERE contype = 'f' 
              AND conrelid::regclass::text LIKE 'app.%'
              AND conrelid::regclass::text IN ('app.credits_ledger', 'app.user_credits')
          LOOP
              EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT ' || constraint_record.conname;
          END LOOP;
      END $$;
    `;
    
    // Add correct constraints
    await sql`
      ALTER TABLE app.credits_ledger 
      ADD CONSTRAINT fk_credits_ledger_user_id 
      FOREIGN KEY (user_id) REFERENCES app.user_credits(user_id)
    `;
    
    console.log('✅ Foreign key constraints fixed');
    
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
    
    // Test credit reservation
    try {
      const testUser = crypto.randomUUID();
      const testRequest = crypto.randomUUID();
      
      // First create a user with credits
      await sql`INSERT INTO app.user_credits (user_id, balance) VALUES (${testUser}::uuid, 30)`;
      
      // Test reservation
      const reserveResult = await sql`SELECT * FROM app.reserve_credits(${testUser}::uuid, ${testRequest}::uuid, 'image.gen', 2)`;
      console.log('✅ Credit reservation: working');
      
      // Test finalization
      await sql`SELECT app.finalize_credits(${testUser}::uuid, ${testRequest}::uuid, 'commit')`;
      console.log('✅ Credit finalization: working');
      
      // Clean up test data
      await sql`DELETE FROM app.credits_ledger WHERE user_id = ${testUser}::uuid`;
      await sql`DELETE FROM app.user_credits WHERE user_id = ${testUser}::uuid`;
      
    } catch (error) {
      console.log('❌ Credit flow test:', error.message);
    }
    
    console.log('\n🎉 Final token system fix completed!');
    
  } catch (error) {
    console.error('❌ Error during final fix:', error);
  }
}

finalTokenSystemFix();
