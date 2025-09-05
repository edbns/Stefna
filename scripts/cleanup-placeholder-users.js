// scripts/cleanup-placeholder-users.js
// Run this with: node scripts/cleanup-placeholder-users.js

import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function cleanup() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🧹 Starting placeholder user cleanup...\n');

    // Begin transaction
    await client.query('BEGIN');

    // Show what we're about to delete
    const placeholderUsers = await client.query(
      "SELECT id, email, name FROM users WHERE email LIKE 'user-%@placeholder.com' ORDER BY created_at"
    );
    
    console.log(`Found ${placeholderUsers.rows.length} placeholder users:`);
    placeholderUsers.rows.forEach(user => {
      console.log(`  - ${user.email} (name: ${user.name || 'none'})`);
    });
    console.log('');

    // Count associated data
    const mediaCount = await client.query(`
      WITH placeholder_users AS (
        SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
      )
      SELECT 
        (SELECT COUNT(*) FROM custom_prompt_media WHERE user_id IN (SELECT id FROM placeholder_users)) as custom,
        (SELECT COUNT(*) FROM emotion_mask_media WHERE user_id IN (SELECT id FROM placeholder_users)) as emotion,
        (SELECT COUNT(*) FROM ghibli_reaction_media WHERE user_id IN (SELECT id FROM placeholder_users)) as ghibli,
        (SELECT COUNT(*) FROM neo_glitch_media WHERE user_id IN (SELECT id FROM placeholder_users)) as neo,
        (SELECT COUNT(*) FROM presets_media WHERE user_id IN (SELECT id FROM placeholder_users)) as presets
    `);
    
    const counts = mediaCount.rows[0];
    console.log('Associated media to be deleted:');
    console.log(`  - Custom prompts: ${counts.custom}`);
    console.log(`  - Emotion masks: ${counts.emotion}`);
    console.log(`  - Ghibli reactions: ${counts.ghibli}`);
    console.log(`  - Neo glitch: ${counts.neo}`);
    console.log(`  - Presets: ${counts.presets}`);
    console.log('');

    // Ask for confirmation
    console.log('⚠️  This will permanently delete all placeholder users and their data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete from all related tables
    const tables = [
      'credits_ledger',
      'user_credits',
      'user_settings',
      'custom_prompt_media',
      'emotion_mask_media',
      'ghibli_reaction_media',
      'neo_glitch_media',
      'presets_media',
      'story',
      'assets',
      'ai_generations',
      'video_jobs'
    ];

    console.log('Deleting associated data...');
    
    for (const table of tables) {
      const result = await client.query(`
        WITH placeholder_users AS (
          SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
        )
        DELETE FROM ${table} WHERE user_id IN (SELECT id FROM placeholder_users)
      `);
      if (result.rowCount > 0) {
        console.log(`  ✓ Deleted ${result.rowCount} records from ${table}`);
      }
    }

    // Special handling for story_photo (delete via story table)
    const storyPhotoResult = await client.query(`
      WITH placeholder_users AS (
        SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
      ),
      placeholder_stories AS (
        SELECT id FROM story WHERE user_id IN (SELECT id FROM placeholder_users)
      )
      DELETE FROM story_photo WHERE story_id IN (SELECT id FROM placeholder_stories)
    `);
    if (storyPhotoResult.rowCount > 0) {
      console.log(`  ✓ Deleted ${storyPhotoResult.rowCount} records from story_photo`);
    }

    // Referral signups table removed - using email-based referrals only

    // Finally, delete the users
    const userResult = await client.query(
      "DELETE FROM users WHERE email LIKE 'user-%@placeholder.com'"
    );
    console.log(`\n✓ Deleted ${userResult.rowCount} placeholder users\n`);

    // Commit transaction
    await client.query('COMMIT');

    // Show remaining users
    const remainingUsers = await client.query(
      "SELECT id, email, created_at FROM users ORDER BY created_at"
    );
    
    console.log('Remaining users in database:');
    remainingUsers.rows.forEach(user => {
      console.log(`  ✓ ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`);
    });

    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the cleanup
cleanup().catch(console.error);
