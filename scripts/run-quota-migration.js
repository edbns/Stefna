// Script to run the quota migration
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runQuotaMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Running beta quota configuration migration...');
    
    // Read and execute the migration
    const migrationPath = path.join(__dirname, '..', 'migrations', '20241220_add_beta_quota_config.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSql);
    console.log('✅ Beta quota configuration migration completed successfully');

    // Verify the migration worked
    const configResult = await client.query(`
      SELECT key, value FROM app_config 
      WHERE key IN ('beta_quota_limit', 'beta_quota_enabled')
    `);
    
    console.log('\n=== QUOTA CONFIGURATION ===');
    configResult.rows.forEach(row => {
      console.log(`${row.key}: ${row.value}`);
    });

    // Test the quota functions
    const quotaStatusResult = await client.query('SELECT * FROM get_quota_status()');
    const quotaStatus = quotaStatusResult.rows[0];
    
    console.log('\n=== QUOTA STATUS ===');
    console.log(`Quota enabled: ${quotaStatus.quota_enabled}`);
    console.log(`Quota limit: ${quotaStatus.quota_limit}`);
    console.log(`Current count: ${quotaStatus.current_count}`);
    console.log(`Quota reached: ${quotaStatus.quota_reached}`);
    console.log(`Remaining slots: ${quotaStatus.remaining_slots}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

runQuotaMigration();
