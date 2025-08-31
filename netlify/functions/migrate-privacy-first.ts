import type { Handler } from "@netlify/functions";
import { q } from './_db';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔒 Starting privacy-first migration...');

    // Step 1: Update user settings to private by default
    const userSettingsResult = await q(`
      UPDATE user_settings 
      SET share_to_feed = false, 
          updated_at = NOW()
      WHERE share_to_feed = true
    `);
    console.log('✅ Updated user settings:', userSettingsResult);

    // Step 2: Update all media to private
    const mediaUpdates = await Promise.all([
      q(`UPDATE ghibli_reaction_media SET status = 'private', updated_at = NOW() WHERE status = 'public'`),
      q(`UPDATE emotion_mask_media SET status = 'private', updated_at = NOW() WHERE status = 'public'`),
      q(`UPDATE presets_media SET status = 'private', updated_at = NOW() WHERE status = 'public'`),
      q(`UPDATE custom_prompt_media SET status = 'private', updated_at = NOW() WHERE status = 'public'`),
      q(`UPDATE neo_glitch_media SET status = 'private', updated_at = NOW() WHERE status = 'public'`)
    ]);

    console.log('✅ Updated media tables:', mediaUpdates);

    // Step 3: Verify the changes
    const verification = await q(`
      SELECT 
        'user_settings' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN share_to_feed = false THEN 1 END) as private_users,
        COUNT(CASE WHEN share_to_feed = true THEN 1 END) as public_users
      FROM user_settings
      UNION ALL
      SELECT 
        'ghibli_reaction_media' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
        COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
      FROM ghibli_reaction_media
      UNION ALL
      SELECT 
        'emotion_mask_media' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
        COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
      FROM emotion_mask_media
      UNION ALL
      SELECT 
        'presets_media' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
        COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
      FROM presets_media
      UNION ALL
      SELECT 
        'custom_prompt_media' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
        COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
      FROM custom_prompt_media
      UNION ALL
      SELECT 
        'neo_glitch_media' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'private' THEN 1 END) as private_media,
        COUNT(CASE WHEN status = 'public' THEN 1 END) as public_media
      FROM neo_glitch_media
    `);

    console.log('✅ Migration verification:', verification);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Privacy-first migration completed successfully',
        verification
      })
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
