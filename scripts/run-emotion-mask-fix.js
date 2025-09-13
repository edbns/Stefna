import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Running emotion mask trigger fix migration...');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', '20241220_fix_emotion_mask_trigger.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSql);
    
    console.log('✅ Successfully fixed emotion_mask_media trigger references');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
