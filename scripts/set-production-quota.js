// Production script to set the real quota limit (45 users)
// Run this when you're ready to launch with the actual quota

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function setProductionQuota() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Set production quota (45 users total - 40 + your 5 content accounts)
    const productionQuota = 45;
    
    console.log(`Setting production quota to ${productionQuota} users...`);
    
    await client.query(`
      INSERT INTO app_config (key, value) 
      VALUES ('beta_quota_limit', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [productionQuota.toString()]);

    // Ensure quota system is enabled
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

    console.log('\n=== PRODUCTION QUOTA SET ===');
    console.log(`Current users: ${currentUserCount}`);
    console.log(`Production quota: ${quotaStatus.quota_limit}`);
    console.log(`Quota enabled: ${quotaStatus.quota_enabled}`);
    console.log(`Quota reached: ${quotaStatus.quota_reached}`);
    console.log(`Remaining slots: ${quotaStatus.remaining_slots}`);
    
    if (quotaStatus.quota_reached) {
      console.log('\n🚫 PRODUCTION QUOTA REACHED');
      console.log('New users will see waitlist modal');
    } else {
      console.log('\n✅ PRODUCTION QUOTA ACTIVE');
      console.log(`${quotaStatus.remaining_slots} spots available for new users`);
    }

    console.log('\n=== LAUNCH READY ===');
    console.log('Your beta quota system is now active with 45 user limit');
    console.log('Monitor the admin dashboard for user count updates');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

// Run the production setup
setProductionQuota();
