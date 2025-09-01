// netlify/functions/cleanup-placeholder-users.ts
// ONE-TIME cleanup function to remove placeholder users
// DELETE THIS FILE after running it once!

import type { Handler } from '@netlify/functions';
import { Client as PgClient } from 'pg';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Admin authentication
  const adminSecret = event.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const client = new PgClient({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('🧹 Starting placeholder user cleanup...');

    // Begin transaction
    await client.query('BEGIN');

    // Count placeholder users before deletion
    const beforeCount = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE email LIKE 'user-%@placeholder.com'"
    );
    console.log(`Found ${beforeCount.rows[0].count} placeholder users to delete`);

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
      'referral_signups'
    ];

    const deletionResults: any = {};
    
    for (const table of tables) {
      let result;
      if (table === 'referral_signups') {
        result = await client.query(`
          WITH placeholder_users AS (
            SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
          )
          DELETE FROM ${table} 
          WHERE referrer_user_id IN (SELECT id FROM placeholder_users) 
             OR new_user_id IN (SELECT id FROM placeholder_users)
        `);
      } else {
        result = await client.query(`
          WITH placeholder_users AS (
            SELECT id FROM users WHERE email LIKE 'user-%@placeholder.com'
          )
          DELETE FROM ${table} WHERE user_id IN (SELECT id FROM placeholder_users)
        `);
      }
      deletionResults[table] = result.rowCount;
      console.log(`Deleted ${result.rowCount} records from ${table}`);
    }

    // Finally, delete the users themselves
    const userDeletion = await client.query(
      "DELETE FROM users WHERE email LIKE 'user-%@placeholder.com'"
    );
    deletionResults.users = userDeletion.rowCount;

    // Commit transaction
    await client.query('COMMIT');

    // Get remaining users
    const remainingUsers = await client.query(
      "SELECT id, email, created_at FROM users ORDER BY created_at"
    );

    console.log('✅ Cleanup completed successfully!');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Placeholder users cleaned up successfully',
        deletedCounts: deletionResults,
        remainingUsers: remainingUsers.rows
      }, null, 2)
    };

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Cleanup failed',
        message: error.message
      })
    };
  } finally {
    await client.end();
  }
};
