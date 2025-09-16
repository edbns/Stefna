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
    console.log('🔍 [Clean Likes] Checking for duplicate likes...');

    // Find duplicate likes (same user, same media, same type)
    const duplicates = await q(`
      SELECT user_id, media_id, media_type, COUNT(*) as count
      FROM likes 
      GROUP BY user_id, media_id, media_type 
      HAVING COUNT(*) > 1
    `);

    console.log(`Found ${duplicates.length} duplicate like groups`);

    let cleanedCount = 0;
    
    // Clean up duplicates by keeping only the first one
    for (const duplicate of duplicates) {
      const { user_id, media_id, media_type } = duplicate;
      
      // Get all duplicate records for this combination
      const duplicateRecords = await q(`
        SELECT id, created_at 
        FROM likes 
        WHERE user_id = $1 AND media_id = $2 AND media_type = $3 
        ORDER BY created_at ASC
      `, [user_id, media_id, media_type]);

      // Keep the first record, delete the rest
      if (duplicateRecords.length > 1) {
        const keepId = duplicateRecords[0].id;
        const deleteIds = duplicateRecords.slice(1).map(r => r.id);
        
        await q(`
          DELETE FROM likes 
          WHERE id = ANY($1)
        `, [deleteIds]);
        
        cleanedCount += deleteIds.length;
        console.log(`Cleaned ${deleteIds.length} duplicates for ${media_type}:${media_id}`);
      }
    }

    // Add missing updated_at column if it doesn't exist
    try {
      await q(`
        ALTER TABLE likes 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(6) DEFAULT NOW()
      `);
      console.log('Added updated_at column to likes table');
    } catch (error) {
      console.log('updated_at column already exists or error:', error);
    }

    // Get final counts
    const totalLikes = await q(`SELECT COUNT(*) as count FROM likes`);
    const uniqueLikes = await q(`
      SELECT COUNT(DISTINCT CONCAT(user_id, ':', media_id, ':', media_type)) as count 
      FROM likes
    `);

    console.log('✅ [Clean Likes] Cleanup completed');

    return json({
      success: true,
      message: 'Successfully cleaned duplicate likes',
      stats: {
        duplicatesFound: duplicates.length,
        duplicatesCleaned: cleanedCount,
        totalLikes: totalLikes[0]?.count || 0,
        uniqueLikes: uniqueLikes[0]?.count || 0
      }
    });

  } catch (error: any) {
    console.error('💥 [Clean Likes] Error:', error?.message || error);
    return json({ 
      error: 'Failed to clean likes',
      details: error?.message 
    }, { status: 500 });
  }
};
