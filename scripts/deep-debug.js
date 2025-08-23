import { neon } from '@neondatabase/serverless';

async function deepDebug() {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('🔍 Deep debugging the public feed query...');
    
    // Let's run the EXACT same query as the backend
    const exactQuery = await sql`
      SELECT 
        ma.id,
        ma.user_id,
        u.email AS user_email,
        ma.cloudinary_public_id,
        COALESCE(ma.media_type, ma.resource_type) AS resource_type,
        ma.prompt,
        ma.created_at AS published_at,
        ma.is_public AS visibility,
        ma.allow_remix,
        ma.final_url,
        ma.status,
        ma.meta,
        ma.preset_key,
        ma.preset_id
      FROM media_assets ma
      LEFT JOIN users u ON ma.user_id::uuid = u.id
      WHERE ma.is_public = true 
        AND ma.status = 'ready'
        AND ma.created_at IS NOT NULL
        AND ma.final_url IS NOT NULL
      ORDER BY ma.created_at DESC
      LIMIT 20
    `;
    
    console.log('📊 Exact query result count:', exactQuery.length);
    
    // Check if your items are in this result
    const yourItemIds = [
      '604ac1bb-5fe0-46a5-a74e-f509fe38cad5',
      '140132a2-8999-4632-b03f-79b7e62d071e',
      'dcf0846d-5616-4e85-8742-16786438107f'
    ];
    
    const resultIds = new Set(exactQuery.map(item => item.id));
    
    console.log('\n🔍 Your items in exact query result:');
    yourItemIds.forEach(id => {
      const found = resultIds.has(id);
      console.log(`  - ${id}: ${found ? '✅ FOUND' : '❌ MISSING'}`);
    });
    
    // Let's check the JOIN issue - maybe the user_id casting is failing
    console.log('\n🔍 Checking user_id casting issue...');
    const userCheck = await sql`
      SELECT 
        ma.id,
        ma.user_id,
        ma.user_id::uuid as casted_user_id,
        u.id as user_table_id,
        u.email
      FROM media_assets ma
      LEFT JOIN users u ON ma.user_id::uuid = u.id
      WHERE ma.id IN ('604ac1bb-5fe0-46a5-a74e-f509fe38cad5', '140132a2-8999-4632-b03f-79b7e62d071e')
    `;
    
    userCheck.forEach(item => {
      console.log(`\n  Item ${item.id}:`);
      console.log(`    ma.user_id: ${item.user_id} (type: ${typeof item.user_id})`);
      console.log(`    casted_user_id: ${item.casted_user_id}`);
      console.log(`    user_table_id: ${item.user_table_id}`);
      console.log(`    email: ${item.email}`);
    });
    
    // Let's also check if there's a data type issue with the WHERE clause
    console.log('\n🔍 Testing WHERE clause conditions individually...');
    const whereTest = await sql`
      SELECT id, user_id, is_public, status, created_at, final_url
      FROM media_assets 
      WHERE id = '604ac1bb-5fe0-46a5-a74e-f509fe38cad5'
    `;
    
    if (whereTest.length > 0) {
      const item = whereTest[0];
      console.log('\n  Testing item conditions:');
      console.log(`    is_public = true: ${item.is_public === true ? '✅' : '❌'} (${item.is_public})`);
      console.log(`    status = 'ready': ${item.status === 'ready' ? '✅' : '❌'} (${item.status})`);
      console.log(`    created_at IS NOT NULL: ${item.created_at !== null ? '✅' : '❌'} (${item.created_at})`);
      console.log(`    final_url IS NOT NULL: ${item.final_url !== null ? '✅' : '❌'} (${item.final_url})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deepDebug();
