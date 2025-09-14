// Test script to set a lower quota for testing the beta quota system
// This allows you to test with fewer users before setting the real limit to 45

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testQuotaSystem() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Set a low quota for testing (e.g., 10 users)
    const testQuota = 10;
    
    console.log(`Setting test quota to ${testQuota} users...`);
    
    await client.query(`
      INSERT INTO app_config (key, value) 
      VALUES ('beta_quota_limit', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [testQuota.toString()]);

    // Enable quota system
    await client.query(`
      INSERT INTO app_config (key, value) 
      VALUES ('beta_quota_enabled', 'true')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);

    // Get current user count
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    const currentUserCount = parseInt(userCountResult.rows[0].count);

    // Check quota status
    const quotaStatusResult = await client.query('SELECT * FROM get_quota_status()');
    const quotaStatus = quotaStatusResult.rows[0];

    console.log('\n=== QUOTA SYSTEM STATUS ===');
    console.log(`Current users: ${currentUserCount}`);
    console.log(`Quota limit: ${quotaStatus.quota_limit}`);
    console.log(`Quota enabled: ${quotaStatus.quota_enabled}`);
    console.log(`Quota reached: ${quotaStatus.quota_reached}`);
    console.log(`Remaining slots: ${quotaStatus.remaining_slots}`);
    
    if (quotaStatus.quota_reached) {
      console.log('\n🚫 QUOTA REACHED - New users will see waitlist modal');
    } else {
      console.log('\n✅ QUOTA AVAILABLE - New users can still sign up');
    }

    console.log('\n=== NEXT STEPS ===');
    console.log('1. Test the system by trying to sign up with a new email');
    console.log('2. Check if the waitlist modal appears when quota is reached');
    console.log('3. Verify the admin dashboard shows the correct quota status');
    console.log('4. When ready for production, run: node scripts/set-production-quota.js');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

// Run the test
testQuotaSystem();
