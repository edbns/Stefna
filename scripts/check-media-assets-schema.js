import { neon } from '@neondatabase/serverless';

async function checkMediaAssetsSchema() {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('🔍 Checking media_assets table schema...');
    
    // Check table structure
    const tableInfo = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'media_assets'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 media_assets table columns:');
    tableInfo.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check if id column has default value
    const idColumn = tableInfo.find(col => col.column_name === 'id');
    if (idColumn) {
      console.log(`\n🎯 ID column details:`);
      console.log(`  Type: ${idColumn.data_type}`);
      console.log(`  Nullable: ${idColumn.is_nullable}`);
      console.log(`  Default: ${idColumn.column_default || 'none'}`);
    }
    
    // Check table constraints
    const constraints = await sql`
      SELECT 
        constraint_name,
        constraint_type,
        table_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'media_assets'
    `;
    
    console.log(`\n🔒 Table constraints:`);
    constraints.forEach(constraint => {
      console.log(`  ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
    // Check if there are any triggers
    const triggers = await sql`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'media_assets'
    `;
    
    console.log(`\n⚡ Triggers:`);
    if (triggers.length === 0) {
      console.log('  No triggers found');
    } else {
      triggers.forEach(trigger => {
        console.log(`  ${trigger.trigger_name}: ${trigger.event_manipulation} -> ${trigger.action_statement?.substring(0, 100)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMediaAssetsSchema();
