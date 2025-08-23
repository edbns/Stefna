import { neon } from '@neondatabase/serverless';

async function restoreNeoGlitch() {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('🔧 Restoring Neo Glitch item to ready status...');
    
    const neoGlitchItemId = '7b94175d-e822-4930-83cb-d607f864ec9f';
    
    // Restore the item to ready status and clean up the failure metadata
    const updateResult = await sql`
      UPDATE media_assets 
      SET status = 'ready',
          meta = jsonb_build_object(
            'mode', 'neotokyoglitch',
            'runId', 1,
            'presetId', null,
            'restored_at', NOW(),
            'restored_from', 'failed_status'
          )
      WHERE id = ${neoGlitchItemId}
      RETURNING id, status, meta
    `;
    
    if (updateResult.length === 0) {
      console.log('❌ Item not found');
      return;
    }
    
    console.log('✅ Item restored to ready status:', updateResult[0]);
    console.log('🎯 This item should now appear in the public feed!');
    
    // Verify it now meets public feed criteria
    const restoredItem = await sql`
      SELECT id, prompt, final_url, meta, created_at, is_public, status
      FROM media_assets 
      WHERE id = ${neoGlitchItemId}
    `;
    
    if (restoredItem.length > 0) {
      const item = restoredItem[0];
      const meetsCriteria = item.is_public === true && item.status === 'ready' && item.final_url;
      console.log(`\n🔍 Public feed criteria check:`);
      console.log(`  is_public = true: ${item.is_public === true ? '✅ YES' : '❌ NO'}`);
      console.log(`  status = 'ready': ${item.status === 'ready' ? '✅ YES' : '❌ NO'}`);
      console.log(`  final_url exists: ${item.final_url ? '✅ YES' : '❌ NO'}`);
      console.log(`  🎯 Meets all criteria: ${meetsCriteria ? '✅ YES' : '❌ NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

restoreNeoGlitch();
