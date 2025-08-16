const { sql } = require('../lib/db');
const { getAuthedUser } = require('../lib/auth');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // Use new auth helper
    const { user, error } = await getAuthedUser(event);
    if (!user || error) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    console.log(`🔄 Starting migration for user: ${user.id}`);

    // Step 1: Get all user's media that needs migration
    let userMedia;
    try {
      userMedia = await sql`
        SELECT id, visibility, env, created_at
        FROM media_assets
        WHERE owner_id = ${user.id}
        AND env IN ('dev', 'development')
        ORDER BY created_at DESC
      `;
    } catch (fetchError) {
      console.error('❌ Failed to fetch user media:', fetchError);
      return { statusCode: 500, body: JSON.stringify({ error: fetchError.message }) };
    }

    if (!userMedia || userMedia.length === 0) {
      console.log(`✅ No media found for user ${user.id} that needs migration`);
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'No media needs migration',
          migratedCount: 0,
          totalUserMedia: 0
        })
      };
    }

    console.log(`📊 Found ${userMedia.length} media items to migrate for user ${user.id}`);

    // Step 2: Start transaction - migrate media in batches
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < userMedia.length; i += batchSize) {
      batches.push(userMedia.slice(i, i + batchSize));
    }

    let totalMigrated = 0;
    let totalErrors = 0;
    const errors = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);

      for (const media of batch) {
        try {
          // Update each media item individually for safety
          const updateResult = await sql`
            UPDATE media_assets
            SET env = 'production', updated_at = NOW()
            WHERE id = ${media.id}
            AND owner_id = ${user.id}
          `;

          if (updateResult.length === 0) {
            console.error(`❌ Failed to migrate media ${media.id}: No rows updated`);
            totalErrors++;
            errors.push({ mediaId: media.id, error: 'No rows updated' });
          } else {
            totalMigrated++;
            console.log(`✅ Migrated media ${media.id} (${media.visibility} -> production)`);
          }
        } catch (e) {
          console.error(`❌ Exception migrating media ${media.id}:`, e);
          totalErrors++;
          errors.push({ mediaId: media.id, error: e.message });
        }
      }

      // Small delay between batches to avoid overwhelming the database
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 3: Verify migration results
    let verificationData;
    try {
      verificationData = await sql`
        SELECT id, env, visibility
        FROM media_assets
        WHERE owner_id = ${user.id}
        AND env = 'production'
      `;
    } catch (verificationError) {
      console.error('❌ Verification failed:', verificationError);
      verificationData = [];
    }

    const result = {
      message: 'Migration completed',
      userId: user.id,
      totalMigrated,
      totalErrors,
      totalUserMedia: userMedia.length,
      prodMediaCount: verificationData?.length || 0,
      errors: errors.slice(0, 10), // Limit error details
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Migration completed for user ${user.id}:`, result);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (e) {
    console.error('❌ Migration function crashed:', e);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Migration function crashed' }) 
    };
  }
};

