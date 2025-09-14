// Script to run the email trigger migration
import { Client } from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runEmailTriggerMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Read the migration file
    const migrationSQL = readFileSync('./migrations/20241220_add_quota_change_email_trigger.sql', 'utf8');
    
    console.log('🚀 Running email trigger migration...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Email trigger migration completed successfully!');
    console.log('📧 Database trigger is now active');
    console.log('🎯 When you change beta_quota_limit in app_config, emails will automatically queue');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runEmailTriggerMigration();
