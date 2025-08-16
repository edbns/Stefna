import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';

export const handler: Handler = async () => {
  try {
    // Test basic connection
    const connectionTest = await sql`SELECT 1 as test`;
    console.log('✅ Database connection:', connectionTest);

    // Check media table structure
    const mediaColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'media'
      ORDER BY ordinal_position
    `;
    console.log('📊 Media table columns:', mediaColumns);

    // Check if we can insert a test row
    const testInsert = await sql`
      INSERT INTO media (
        id, user_id, url, media_type, final_url, 
        prompt, is_public, created_at
      ) VALUES (
        'test-${Date.now()}', 'test-user', 'https://test.com/image.jpg', 
        'image', 'https://test.com/image.jpg', 'test prompt', false, NOW()
      ) RETURNING id, url, media_type
    `;
    console.log('✅ Test insert successful:', testInsert);

    // Clean up test data
    await sql`DELETE FROM media WHERE id LIKE 'test-%'`;
    console.log('🧹 Test data cleaned up');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        connection: 'working',
        mediaColumns: mediaColumns,
        testInsert: testInsert[0],
        message: 'Database schema test completed successfully'
      })
    };

  } catch (error: any) {
    console.error('❌ Database test failed:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: error.message,
        stack: error.stack,
        hint: 'Check if all required columns exist and have correct types'
      })
    };
  }
};
