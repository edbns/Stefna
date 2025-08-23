import { neon } from '@neondatabase/serverless';

async function checkFinalUrl() {
  try {
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    console.log('🔍 Checking final_url field for user items...');
    
    const userItems = await sql`
      SELECT id, prompt, final_url, cloudinary_public_id, meta
      FROM media_assets 
      WHERE user_id = '7716ab85-4c72-4854-9c4c-67714196bc2d'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    userItems.forEach(item => {
      console.log(`\n  Item ${item.id}:`);
      console.log(`    prompt: ${item.prompt?.substring(0, 60)}...`);
      console.log(`    final_url: ${item.final_url || 'NULL'}`);
      console.log(`    cloudinary_public_id: ${item.cloudinary_public_id || 'NULL'}`);
      console.log(`    meta: ${JSON.stringify(item.meta)}`);
    });
    
    // Check if there are any items with final_url = NULL
    const nullUrlItems = await sql`
      SELECT COUNT(*) as count 
      FROM media_assets 
      WHERE user_id = '7716ab85-4c72-4854-9c4c-67714196bc2d' 
        AND final_url IS NULL
    `;
    
    console.log(`\n📊 Items with NULL final_url: ${nullUrlItems[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFinalUrl();
