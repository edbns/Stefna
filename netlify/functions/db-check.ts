import type { Handler } from "@netlify/functions";
import { q } from './_db';
import { json } from "./_lib/http";

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  console.log('🔍 [db-check] Checking database structure...');

  try {
    // Check likes table structure
    const likesStructure = await q(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'likes' 
      ORDER BY ordinal_position
    `);

    // Check edit_media table structure
    const editMediaStructure = await q(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'edit_media' 
      ORDER BY ordinal_position
    `);

    // Check story table structure
    const storyStructure = await q(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'story' 
      ORDER BY ordinal_position
    `);

    // Get sample data from edit_media
    const editMediaSample = await q(`
      SELECT id, user_id, status, created_at 
      FROM edit_media 
      LIMIT 3
    `);

    // Get sample data from story
    const storySample = await q(`
      SELECT id, user_id, status, created_at 
      FROM story 
      LIMIT 3
    `);

    // Check likes table data
    const likesSample = await q(`
      SELECT media_id, media_type, created_at 
      FROM likes 
      LIMIT 5
    `);

    console.log('✅ [db-check] Database check completed');

    return json({ 
      success: true,
      likesTable: {
        structure: likesStructure,
        sampleData: likesSample
      },
      editMediaTable: {
        structure: editMediaStructure,
        sampleData: editMediaSample
      },
      storyTable: {
        structure: storyStructure,
        sampleData: storySample
      }
    });

  } catch (error) {
    console.error('💥 [db-check] Error:', error);
    return json({ 
      error: 'Failed to check database', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
