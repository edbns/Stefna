import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function inspectDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Inspecting database structure...\n');
    
    // Check which tables exist
    console.log('📋 EXISTING TABLES:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Check if likes table exists and its structure
    console.log('\n🔍 LIKES TABLE STRUCTURE:');
    try {
      const likesStructure = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'likes' 
        ORDER BY ordinal_position
      `);
      
      if (likesStructure.rows.length > 0) {
        likesStructure.rows.forEach(row => {
          console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
      } else {
        console.log('  ❌ likes table does not exist');
      }
    } catch (error) {
      console.log('  ❌ Error checking likes table:', error.message);
    }
    
    // Check media tables and their structure
    const mediaTables = ['custom_prompt_media', 'unreal_reflection_media', 'ghibli_reaction_media', 'cyber_siren_media', 'neo_glitch_media', 'presets_media', 'edit_media', 'parallel_self_media', 'story'];
    
    console.log('\n🔍 MEDIA TABLES STRUCTURE:');
    for (const tableName of mediaTables) {
      try {
        const structure = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (structure.rows.length > 0) {
          console.log(`\n  📋 ${tableName}:`);
          structure.rows.forEach(row => {
            console.log(`    ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
          });
        } else {
          console.log(`\n  ❌ ${tableName}: table does not exist`);
        }
      } catch (error) {
        console.log(`\n  ❌ ${tableName}: error - ${error.message}`);
      }
    }
    
    // Check constraints
    console.log('\n🔍 CONSTRAINTS:');
    try {
      const constraints = await client.query(`
        SELECT conname, contype, consrc 
        FROM pg_constraint 
        WHERE conname LIKE '%media_type%' OR conname LIKE '%likes%'
        ORDER BY conname
      `);
      
      if (constraints.rows.length > 0) {
        constraints.rows.forEach(row => {
          console.log(`  ${row.conname}: ${row.contype} - ${row.consrc || 'N/A'}`);
        });
      } else {
        console.log('  No relevant constraints found');
      }
    } catch (error) {
      console.log('  ❌ Error checking constraints:', error.message);
    }
    
    // Check triggers
    console.log('\n🔍 TRIGGERS:');
    try {
      const triggers = await client.query(`
        SELECT trigger_name, event_object_table, action_statement 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%likes%' OR trigger_name LIKE '%media%'
        ORDER BY trigger_name
      `);
      
      if (triggers.rows.length > 0) {
        triggers.rows.forEach(row => {
          console.log(`  ${row.trigger_name} on ${row.event_object_table}: ${row.action_statement}`);
        });
      } else {
        console.log('  No relevant triggers found');
      }
    } catch (error) {
      console.log('  ❌ Error checking triggers:', error.message);
    }
    
    // Check indexes
    console.log('\n🔍 INDEXES:');
    try {
      const indexes = await client.query(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename LIKE '%media%' OR tablename = 'likes'
        ORDER BY tablename, indexname
      `);
      
      if (indexes.rows.length > 0) {
        indexes.rows.forEach(row => {
          console.log(`  ${row.indexname} on ${row.tablename}`);
        });
      } else {
        console.log('  No relevant indexes found');
      }
    } catch (error) {
      console.log('  ❌ Error checking indexes:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

inspectDatabase().catch(console.error);
