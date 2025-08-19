import { Handler } from '@netlify/functions';
import { sql } from '../lib/db';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🧹 Starting cleanup of fake cloudinary_public_id values...');

    // 1. First, let's see what we're dealing with
    const statsBefore = await sql`
      SELECT 
        COUNT(*) as total_assets,
        COUNT(CASE WHEN cloudinary_public_id IS NOT NULL THEN 1 END) as with_cloudinary_id,
        COUNT(CASE WHEN cloudinary_public_id LIKE 'stefna/%' THEN 1 END) as valid_stefna,
        COUNT(CASE WHEN cloudinary_public_id ~ '^[a-zA-Z0-9]{20,}$' THEN 1 END) as valid_cloudinary,
        COUNT(CASE 
          WHEN cloudinary_public_id IS NOT NULL 
          AND cloudinary_public_id NOT LIKE 'stefna/%'
          AND cloudinary_public_id !~ '^[a-zA-Z0-9]{20,}$'
          THEN 1 
        END) as fake_ids
      FROM assets
    `;

    const before = statsBefore.rows[0];
    console.log('📊 Before cleanup:', before);

    // 2. Find all fake IDs
    const fakeIds = await sql`
      SELECT 
        id,
        cloudinary_public_id,
        media_type,
        status,
        created_at
      FROM assets 
      WHERE cloudinary_public_id IS NOT NULL
        AND cloudinary_public_id NOT LIKE 'stefna/%'
        AND cloudinary_public_id !~ '^[a-zA-Z0-9]{20,}$'
      ORDER BY created_at DESC
    `;

    console.log(`❌ Found ${fakeIds.rows.length} fake cloudinary_public_id values to clean up`);

    if (fakeIds.rows.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: 'No fake cloudinary_public_id values found',
          stats: before
        })
      };
    }

    // 3. Show what we're about to delete
    console.log('🗑️ Assets to be deleted:');
    fakeIds.rows.forEach(row => {
      console.log(`  ${row.id}: "${row.cloudinary_public_id}" (${row.media_type}, ${row.status})`);
    });

    // 4. Delete the fake assets
    const deleteResult = await sql`
      DELETE FROM assets 
      WHERE cloudinary_public_id IS NOT NULL
        AND cloudinary_public_id NOT LIKE 'stefna/%'
        AND cloudinary_public_id !~ '^[a-zA-Z0-9]{20,}$'
    `;

    console.log(`✅ Deleted ${deleteResult.rowCount} assets with fake cloudinary_public_id values`);

    // 5. Get stats after cleanup
    const statsAfter = await sql`
      SELECT 
        COUNT(*) as total_assets,
        COUNT(CASE WHEN cloudinary_public_id IS NOT NULL THEN 1 END) as with_cloudinary_id,
        COUNT(CASE WHEN cloudinary_public_id LIKE 'stefna/%' THEN 1 END) as valid_stefna,
        COUNT(CASE WHEN cloudinary_public_id ~ '^[a-zA-Z0-9]{20,}$' THEN 1 END) as valid_cloudinary,
        COUNT(CASE 
          WHEN cloudinary_public_id IS NOT NULL 
          AND cloudinary_public_id NOT LIKE 'stefna/%'
          AND cloudinary_public_id !~ '^[a-zA-Z0-9]{20,}$'
          THEN 1 
        END) as fake_ids
      FROM assets
    `;

    const after = statsAfter.rows[0];
    console.log('📊 After cleanup:', after);

    // 6. Check for the specific problematic ID from console logs
    const problematicCheck = await sql`
      SELECT COUNT(*) as count
      FROM assets 
      WHERE cloudinary_public_id = 'vpua3iof2sasrjdoubej'
    `;

    const problematicCount = problematicCheck.rows[0].count;
    console.log(`🔍 Problematic ID 'vpua3iof2sasrjdoubej' count: ${problematicCount}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Cleanup completed successfully`,
        deleted_count: deleteResult.rowCount,
        stats_before: before,
        stats_after: after,
        problematic_id_check: {
          id: 'vpua3iof2sasrjdoubej',
          count: problematicCount
        }
      })
    };

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to cleanup fake cloudinary_public_id values',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
