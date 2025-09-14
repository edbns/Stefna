// Script to disable the quota system (for emergencies or full launch)

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function disableQuota() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Disabling quota system...');
    
    // Disable quota system
    await client.query(`
      INSERT INTO app_config (key, value) 
      VALUES ('beta_quota_enabled', 'false')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);

    // Get current user count
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    const currentUserCount = parseInt(userCountResult.rows[0].count);

    console.log('\n=== QUOTA SYSTEM DISABLED ===');
    console.log(`Current users: ${currentUserCount}`);
    console.log('All users can now sign up without restrictions');
    console.log('\n⚠️  This means unlimited signups are now allowed');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

// Run the disable
disableQuota();
