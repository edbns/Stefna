import type { Handler } from '@netlify/functions';
import { q } from './_db';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('🔄 [Fix Likes Table] Adding missing updated_at column...');

    // Add the missing updated_at column to likes table
    await q(`
      ALTER TABLE likes 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW()
    `);

    // Create the trigger for updated_at
    await q(`
      DROP TRIGGER IF EXISTS update_likes_updated_at ON likes;
      CREATE TRIGGER update_likes_updated_at 
      BEFORE UPDATE ON likes 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Verify the column was added
    const likesStructure = await q(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'likes' 
      ORDER BY ordinal_position
    `);

    console.log('✅ [Fix Likes Table] Successfully added updated_at column');

    return json({
      success: true,
      message: 'Successfully added updated_at column to likes table',
      structure: likesStructure
    });

  } catch (error: any) {
    console.error('💥 [Fix Likes Table] Error:', error?.message || error);
    return json({ 
      error: 'Failed to fix likes table',
      details: error?.message 
    }, { status: 500 });
  }
};
