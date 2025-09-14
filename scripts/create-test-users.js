// Script to create 41 test users for quota testing
import { Client } from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function createTestUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Check current user count
    const currentCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Current users: ${currentCount.rows[0].count}`);

    // Create 41 test users
    const testUsers = [];
    for (let i = 1; i <= 41; i++) {
      const email = `testuser${i}@quota-test.com`;
      const userId = uuidv4();
      
      testUsers.push({
        id: userId,
        email: email,
        name: `Test User ${i}`,
        created_at: new Date().toISOString()
      });
    }

    console.log(`🚀 Creating ${testUsers.length} test users...`);

    // Insert test users
    for (const user of testUsers) {
      await client.query(`
        INSERT INTO users (id, email, name, created_at)
        VALUES ($1, $2, $3, $4)
      `, [user.id, user.email, user.name, user.created_at]);
    }

    // Create user credits for test users
    for (const user of testUsers) {
      await client.query(`
        INSERT INTO user_credits (user_id, credits, balance, updated_at)
        VALUES ($1, 30, 0, NOW())
      `, [user.id]);
    }

    // Check final user count
    const finalCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Final user count: ${finalCount.rows[0].count}`);

    // Check quota status
    const quotaStatus = await client.query('SELECT * FROM get_quota_status()');
    const quota = quotaStatus.rows[0];
    
    console.log('\n🎯 Quota Status After Test Users:');
    console.log(`Current users: ${quota.current_count}`);
    console.log(`Quota limit: ${quota.quota_limit}`);
    console.log(`Quota reached: ${quota.quota_reached}`);
    console.log(`Remaining slots: ${quota.remaining_slots}`);

    if (quota.quota_reached) {
      console.log('\n🚫 QUOTA REACHED! New signups will be blocked.');
      console.log('✅ Test users created successfully - quota system should now be active!');
    } else {
      console.log('\n⚠️  Quota not reached yet. Need more users to test quota blocking.');
    }

    console.log('\n📧 Test Emails Created:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await client.end();
  }
}

createTestUsers();
