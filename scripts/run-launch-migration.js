import { Client } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runLaunchMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Read and execute the migration
    const migrationSQL = fs.readFileSync('./migrations/20241220_add_launch_config.sql', 'utf8');
    
    console.log('📝 Running launch configuration migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Launch configuration migration completed successfully!');
    
    // Verify the migration
    const result = await client.query('SELECT * FROM get_launch_status()');
    console.log('🔍 Launch status:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runLaunchMigration();
