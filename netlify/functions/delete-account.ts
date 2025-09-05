import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';
import { requireAuth } from './_lib/auth';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    // Authenticate the user
    const { userId } = requireAuth(event.headers.authorization);
    
    // Get user email from database instead of relying on header
    const userData = await qOne(`
      SELECT id, email, created_at, total_likes_received 
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (!userData) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = userData.email || 'unknown';

    console.log(`🗑️ [Account Deletion] User ${userId} (${userEmail}) requesting account deletion`);

    // Get counts for logging
    const mediaCounts = await Promise.all([
      qCount('SELECT COUNT(*) as count FROM neo_glitch_media WHERE user_id = $1', [userId]),
      qCount('SELECT COUNT(*) as count FROM ghibli_reaction_media WHERE user_id = $1', [userId]),
      qCount('SELECT COUNT(*) as count FROM emotion_mask_media WHERE user_id = $1', [userId]),
      qCount('SELECT COUNT(*) as count FROM presets_media WHERE user_id = $1', [userId]),
      qCount('SELECT COUNT(*) as count FROM custom_prompt_media WHERE user_id = $1', [userId]),
      qCount('SELECT COUNT(*) as count FROM story WHERE user_id = $1', [userId]),
      qCount('SELECT COUNT(*) as count FROM likes WHERE user_id = $1', [userId]),
      qCount('SELECT COUNT(*) as count FROM user_settings WHERE user_id = $1', [userId])
    ]);

    const [neoGlitch, ghibli, emotion, presets, custom, story, likes, settings] = mediaCounts;

    console.log(`📊 [Account Deletion] Data to be deleted:`, {
      userId,
      email: userEmail,
      neoGlitch,
      ghibli,
      emotion,
      presets,
      custom,
      story,
      likes,
      settings,
      totalLikesReceived: userData.total_likes_received
    });

    // Start a transaction to delete all user data
    await q('BEGIN');

    try {
      // 1. Delete all media types
      console.log('🗑️ [Account Deletion] Deleting media...');
      await q(`DELETE FROM neo_glitch_media WHERE user_id = $1`, [userId]);
      await q(`DELETE FROM ghibli_reaction_media WHERE user_id = $1`, [userId]);
      await q(`DELETE FROM emotion_mask_media WHERE user_id = $1`, [userId]);
      await q(`DELETE FROM presets_media WHERE user_id = $1`, [userId]);
      await q(`DELETE FROM custom_prompt_media WHERE user_id = $1`, [userId]);
      await q(`DELETE FROM story WHERE user_id = $1`, [userId]);

      // 2. Delete story photos (cascade delete should handle this, but let's be explicit)
      console.log('🗑️ [Account Deletion] Deleting story photos...');
      await q(`DELETE FROM story_photo WHERE story_id IN (SELECT id FROM story WHERE user_id = $1)`, [userId]);

      // 3. Delete likes given by the user
      console.log('🗑️ [Account Deletion] Deleting likes given by user...');
      await q(`DELETE FROM likes WHERE user_id = $1`, [userId]);

      // 4. Update total_likes_received for users who received likes from this user
      console.log('🗑️ [Account Deletion] Updating total_likes_received for affected users...');
      await q(`
        UPDATE users 
        SET total_likes_received = total_likes_received - (
          SELECT COUNT(*) 
          FROM likes 
          WHERE user_id = $1 AND media_id IN (
            SELECT id FROM neo_glitch_media WHERE user_id = users.id
            UNION ALL
            SELECT id FROM ghibli_reaction_media WHERE user_id = users.id
            UNION ALL
            SELECT id FROM emotion_mask_media WHERE user_id = users.id
            UNION ALL
            SELECT id FROM presets_media WHERE user_id = users.id
            UNION ALL
            SELECT id FROM custom_prompt_media WHERE user_id = users.id
            UNION ALL
            SELECT id FROM story WHERE user_id = users.id
          )
        )
        WHERE id IN (
          SELECT DISTINCT user_id 
          FROM (
            SELECT user_id FROM neo_glitch_media
            UNION ALL
            SELECT user_id FROM ghibli_reaction_media
            UNION ALL
            SELECT user_id FROM emotion_mask_media
            UNION ALL
            SELECT user_id FROM presets_media
            UNION ALL
            SELECT user_id FROM custom_prompt_media
            UNION ALL
            SELECT user_id FROM story
          ) media_users
          WHERE user_id IN (
            SELECT DISTINCT target_user_id 
            FROM likes 
            WHERE user_id = $1
          )
        )
      `, [userId]);

      // 5. Delete user settings
      console.log('🗑️ [Account Deletion] Deleting user settings...');
      await q(`DELETE FROM user_settings WHERE user_id = $1`, [userId]);

      // 6. Delete user credits
      console.log('🗑️ [Account Deletion] Deleting user credits...');
      await q(`DELETE FROM user_credits WHERE user_id = $1`, [userId]);

      // 7. Delete credit transactions
      console.log('🗑️ [Account Deletion] Deleting credit transactions...');
      await q(`DELETE FROM credits_ledger WHERE user_id = $1`, [userId]);

      // 8. Delete OTP records
      console.log('🗑️ [Account Deletion] Deleting OTP records...');
      await q(`DELETE FROM auth_otps WHERE email = $1`, [userEmail]);

      // 9. Finally delete the user
      console.log('🗑️ [Account Deletion] Deleting user record...');
      await q(`DELETE FROM users WHERE id = $1`, [userId]);

      await q('COMMIT');

      console.log(`✅ [Account Deletion] User ${userId} (${userEmail}) and all associated data deleted successfully`);

      // Send account deleted confirmation email
      try {
        await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: userEmail,
            subject: 'Your Stefna Account Has Been Deleted',
            text: `Hello,

This is to confirm that your Stefna account has been permanently deleted.

If this was a mistake, we're here to help — but your data has been fully removed for your privacy.

Thank you for being part of Stefna.`,
            type: 'account_deleted'
          })
        });
        console.log(`📧 Account deleted confirmation email sent to: ${userEmail}`);
      } catch (emailError) {
        console.warn('⚠️ Failed to send account deleted email:', emailError);
        // Don't fail the deletion if email fails
      }

      return json({
        success: true,
        message: 'Account deleted successfully',
        userId,
        email: userEmail,
        deletedData: {
          neoGlitch,
          ghibli,
          emotion,
          presets,
          custom,
          story,
          likes,
          settings
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await q('ROLLBACK');
      console.error('❌ [Account Deletion] Transaction failed:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ [Account Deletion] Error deleting account:', error);
    return json({ 
      error: 'Failed to delete account',
      details: String(error)
    }, { status: 500 });
  }
};
