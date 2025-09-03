import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';



export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE'
      }
    };
  }

  try {
    if (event.httpMethod !== 'DELETE') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = JSON.parse(event.body || '{}')
    const { userId } = body

    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 })
    }

    console.log(`🗑️ [Admin] Deleting user and all associated data: ${userId}`)

    // Start a transaction to delete all user data
    // Start transaction manually
    await q('BEGIN')

    try {
      // Delete all media types
      await q(`DELETE FROM neo_glitch_media WHERE user_id = $1`, [userId])
      await q(`DELETE FROM ghibli_reaction_media WHERE user_id = $1`, [userId])
      await q(`DELETE FROM emotion_mask_media WHERE user_id = $1`, [userId])
      await q(`DELETE FROM presets_media WHERE user_id = $1`, [userId])
      await q(`DELETE FROM custom_prompt_media WHERE user_id = $1`, [userId])
      await q(`DELETE FROM story WHERE user_id = $1`, [userId])

      // Delete story photos (cascade delete should handle this, but let's be explicit)
      await q(`DELETE FROM story_photo WHERE story_id IN (SELECT id FROM story WHERE user_id = $1)`, [userId])

      // Delete likes given by the user
      await q(`DELETE FROM likes WHERE user_id = $1`, [userId])

      // Update total_likes_received for users who received likes from this user
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
      `, [userId])

      // Delete user settings
      await q(`DELETE FROM user_settings WHERE user_id = $1`, [userId])

      // Delete user credits
      await q(`DELETE FROM user_credits WHERE user_id = $1`, [userId])

      // Delete credit transactions
      await q(`DELETE FROM credits_ledger WHERE user_id = $1`, [userId])

      // Delete OTP records (by email pattern since we might not have exact email)
      await q(`DELETE FROM auth_otps WHERE email LIKE '%' || $1 || '%'`, [userId])

      // Finally delete the user
      await q(`DELETE FROM users WHERE id = $1`, [userId])

      await q('COMMIT')
    } catch (error) {
      await q('ROLLBACK')
      throw error
    }

    console.log(`✅ [Admin] User ${userId} and all associated data deleted successfully`)

    return json({
      success: true,
      message: 'User deleted successfully',
      userId,
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('❌ [Admin] Error deleting user:', e)
    return json({ error: 'Failed to delete user' }, { status: 500 })
  } finally {
    
  }
}
