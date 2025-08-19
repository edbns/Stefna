#!/usr/bin/env node

// Check for remaining fake cloudinary_public_id values
// These are causing 404 errors when the frontend tries to load images

import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkFakeCloudinaryIds() {
  try {
    console.log('🔍 Checking for fake cloudinary_public_id values...\n');

    // 1. Check all cloudinary_public_id values
    console.log('📊 All cloudinary_public_id values (last 20):');
    const allIds = await pool.query(`
      SELECT 
        id,
        cloudinary_public_id,
        LENGTH(cloudinary_public_id) as id_length,
        media_type,
        status,
        created_at
      FROM assets 
      WHERE cloudinary_public_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    allIds.rows.forEach(row => {
      console.log(`  ${row.id}: "${row.cloudinary_public_id}" (${row.id_length} chars, ${row.media_type}, ${row.status})`);
    });

    // 2. Count by type
    console.log('\n📈 Count by ID type:');
    const countByType = await pool.query(`
      SELECT 
        CASE 
          WHEN cloudinary_public_id LIKE 'stefna/%' THEN 'VALID_STEFNA'
          WHEN cloudinary_public_id ~ '^[a-zA-Z0-9]{20,}$' THEN 'VALID_CLOUDINARY'
          ELSE 'FAKE_OR_INVALID'
        END as id_type,
        COUNT(*) as count
      FROM assets 
      WHERE cloudinary_public_id IS NOT NULL
      GROUP BY id_type
      ORDER BY count DESC
    `);
    
    countByType.rows.forEach(row => {
      console.log(`  ${row.id_type}: ${row.count} assets`);
    });

    // 3. Show specific fake IDs that need cleanup
    console.log('\n❌ Fake IDs that need cleanup:');
    const fakeIds = await pool.query(`
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
    `);
    
    if (fakeIds.rows.length === 0) {
      console.log('  ✅ No fake IDs found!');
    } else {
      fakeIds.rows.forEach(row => {
        console.log(`  ${row.id}: "${row.cloudinary_public_id}" (${row.id_length} chars, ${row.media_type}, ${row.status})`);
      });
    }

    // 4. Check for specific problematic IDs from console logs
    console.log('\n🔍 Checking for specific problematic IDs from console logs:');
    const problematicIds = ['vpua3iof2sasrjdoubej'];
    
    for (const id of problematicIds) {
      const result = await pool.query(`
        SELECT id, cloudinary_public_id, media_type, status, created_at
        FROM assets 
        WHERE cloudinary_public_id = $1
      `, [id]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log(`  ❌ Found problematic ID: ${row.id} with cloudinary_public_id "${row.cloudinary_public_id}"`);
      } else {
        console.log(`  ✅ No assets found with cloudinary_public_id "${id}"`);
      }
    }

    console.log('\n✅ Database check completed!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await pool.end();
  }
}

// Run the check
checkFakeCloudinaryIds();
