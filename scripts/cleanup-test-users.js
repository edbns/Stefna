// Script to clean up test users after quota testing
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupTestUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Check current user count
    const beforeCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Users before cleanup: ${beforeCount.rows[0].count}`);

    // Delete test users (by email pattern)
    const deleteResult = await client.query(`
      DELETE FROM users 
      WHERE email LIKE '%@quota-test.com'
    `);

    console.log(`🗑️  Deleted ${deleteResult.rowCount} test users`);

    // Also clean up their credits
    await client.query(`
      DELETE FROM user_credits 
      WHERE user_id NOT IN (SELECT id FROM users)
    `);

    // Check final user count
    const afterCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users after cleanup: ${afterCount.rows[0].count}`);

    // Check quota status
    const quotaStatus = await client.query('SELECT * FROM get_quota_status()');
    const quota = quotaStatus.rows[0];
    
    console.log('\n🎯 Quota Status After Cleanup:');
    console.log(`Current users: ${quota.current_count}`);
    console.log(`Quota limit: ${quota.quota_limit}`);
    console.log(`Quota reached: ${quota.quota_reached}`);
    console.log(`Remaining slots: ${quota.remaining_slots}`);

    console.log('\n✅ Test users cleanup completed!');

  } catch (error) {
    console.error('❌ Error cleaning up test users:', error);
  } finally {
    await client.end();
  }
}

cleanupTestUsers();
