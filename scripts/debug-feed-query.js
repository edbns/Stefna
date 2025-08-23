import { neon } from '@neondatabase/serverless';

async function debugFeedQuery() {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('🔍 Debugging public feed query step by step...');
    
    // Step 1: Check total items with is_public = true
    const step1 = await sql`
      SELECT COUNT(*) as count FROM media_assets WHERE is_public = true
    `;
    console.log('Step 1 - is_public = true:', step1[0].count);
    
    // Step 2: Check items with status = 'ready'
    const step2 = await sql`
      SELECT COUNT(*) as count FROM media_assets WHERE is_public = true AND status = 'ready'
    `;
    console.log('Step 2 - + status = ready:', step2[0].count);
    
    // Step 3: Check items with created_at IS NOT NULL
    const step3 = await sql`
      SELECT COUNT(*) as count FROM media_assets WHERE is_public = true AND status = 'ready' AND created_at IS NOT NULL
    `;
    console.log('Step 3 - + created_at IS NOT NULL:', step3[0].count);
    
    // Step 4: Check items with final_url IS NOT NULL
    const step4 = await sql`
      SELECT COUNT(*) as count FROM media_assets WHERE is_public = true AND status = 'ready' AND created_at IS NOT NULL AND final_url IS NOT NULL
    `;
    console.log('Step 4 - + final_url IS NOT NULL:', step4[0].count);
    
    // Now let's see what items are actually in the public feed
    console.log('\n🔍 Items in public feed (first 10):');
    const publicFeed = await sql`
      SELECT id, user_id, prompt, created_at, final_url
      FROM media_assets 
      WHERE is_public = true 
        AND status = 'ready'
        AND created_at IS NOT NULL
        AND final_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    publicFeed.forEach(item => {
      console.log(`  - ${item.id}: ${item.prompt?.substring(0, 50)}... (created: ${item.created_at})`);
    });
    
    // Check your specific items against each step
    console.log('\n🔍 Testing your items against each step:');
    const yourItems = await sql`
      SELECT id, prompt, is_public, status, created_at, final_url
      FROM media_assets 
      WHERE user_id = '7716ab85-4c72-4854-9c4c-67714196bc2d'
      ORDER BY created_at DESC
      LIMIT 3
    `;
    
    yourItems.forEach(item => {
      const step1Pass = item.is_public === true;
      const step2Pass = step1Pass && item.status === 'ready';
      const step3Pass = step2Pass && item.created_at !== null;
      const step4Pass = step3Pass && item.final_url !== null;
      
      console.log(`\n  Item ${item.id}:`);
      console.log(`    Step 1 (is_public): ${step1Pass ? '✅' : '❌'} (${item.is_public})`);
      console.log(`    Step 2 (status): ${step2Pass ? '✅' : '❌'} (${item.status})`);
      console.log(`    Step 3 (created_at): ${step3Pass ? '✅' : '❌'} (${item.created_at})`);
      console.log(`    Step 4 (final_url): ${step4Pass ? '✅' : '❌'} (${item.final_url ? 'has_url' : 'no_url'})`);
      console.log(`    All steps pass: ${step4Pass ? '✅' : '❌'}`);
    });
    
    // Check if there's a timestamp issue
    console.log('\n🔍 Checking timestamp ranges...');
    const timeRange = await sql`
      SELECT 
        MIN(created_at) as earliest,
        MAX(created_at) as latest,
        COUNT(*) as total
      FROM media_assets 
      WHERE is_public = true AND status = 'ready'
    `;
    
    console.log('Time range:', timeRange[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugFeedQuery();
