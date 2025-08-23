import { neon } from '@neondatabase/serverless';

async function checkNeoGlitch() {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('🔍 Checking recent Neo Glitch media...');
    
    // Check recent media for your user
    const recentMedia = await sql`
      SELECT id, user_id, prompt, meta, is_public, status, final_url, created_at
      FROM media_assets 
      WHERE user_id = '7716ab85-4c72-4854-9c4c-67714196bc2d'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    console.log('📊 Recent media found:', recentMedia.length);
    recentMedia.forEach(item => {
      console.log(`  - ${item.id}:`);
      console.log(`    prompt: ${item.prompt}`);
      console.log(`    meta: ${JSON.stringify(item.meta)}`);
      console.log(`    is_public: ${item.is_public}`);
      console.log(`    status: ${item.status}`);
      console.log(`    has_url: ${!!item.final_url}`);
      console.log(`    created: ${item.created_at}`);
      console.log('');
    });
    
    // Check if any Neo Glitch items exist
    const neoGlitchItems = await sql`
      SELECT id, prompt, meta, is_public, status
      FROM media_assets 
      WHERE meta::text LIKE '%neo%' OR meta::text LIKE '%glitch%' OR prompt LIKE '%neo%' OR prompt LIKE '%glitch%'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('🎭 Neo Glitch items found:', neoGlitchItems.length);
    neoGlitchItems.forEach(item => {
      console.log(`  - ${item.id}: ${item.prompt} (public: ${item.is_public}, status: ${item.status})`);
    });
    
    // Check public feed query
    console.log('\n🔍 Testing public feed query...');
    const publicFeed = await sql`
      SELECT id, user_id, prompt, is_public, status, final_url
      FROM media_assets 
      WHERE is_public = true 
        AND status = 'ready'
        AND created_at IS NOT NULL
        AND final_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    console.log('📊 Public feed items:', publicFeed.length);
    
    // Check if your recent items are in public feed
    const recentIds = new Set(recentMedia.map(item => item.id));
    const publicFeedIds = new Set(publicFeed.map(item => item.id));
    
    console.log('\n🔍 Cross-checking recent items in public feed...');
    recentMedia.forEach(item => {
      const inPublicFeed = publicFeedIds.has(item.id);
      console.log(`  - ${item.id}: in_public_feed=${inPublicFeed}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkNeoGlitch();
