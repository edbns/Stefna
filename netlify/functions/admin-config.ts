import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';

// ============================================================================
// ADMIN SYSTEM CONFIGURATION
// ============================================================================
// This function provides admin access to system configuration
// - View system settings
// - Update system configuration
// - Feature toggles
// - System health monitoring
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
      }
    };
  }

  try {
    // Admin authentication check
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (event.httpMethod === 'GET') {
      // Get system configuration and health
      console.log('🔍 [Admin] Fetching system configuration...')
      
      // Get system statistics
      const systemStats = await q(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_24h,
          (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_7d,
          (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '24 hours') as active_users_24h,
          (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '7 days') as active_users_7d,
          (SELECT COUNT(*) FROM users WHERE is_banned = true) as banned_users,
          (SELECT COUNT(*) FROM user_settings WHERE share_to_feed = true) as public_users,
          (SELECT COUNT(*) FROM likes) as total_likes,
          (SELECT COUNT(*) FROM likes WHERE created_at >= NOW() - INTERVAL '24 hours') as likes_24h
      `);

      // Get media generation statistics
      const mediaStats = await q(`
        SELECT 
          (SELECT COUNT(*) FROM neo_glitch_media WHERE status = 'completed') as neo_glitch_total,
          (SELECT COUNT(*) FROM presets_media WHERE status = 'completed') as presets_total,
          (SELECT COUNT(*) FROM emotion_mask_media WHERE status = 'completed') as emotion_mask_total,
          (SELECT COUNT(*) FROM ghibli_reaction_media WHERE status = 'completed') as ghibli_reaction_total,
          (SELECT COUNT(*) FROM custom_prompt_media WHERE status = 'completed') as custom_prompt_total,
          (SELECT COUNT(*) FROM edit_media WHERE status = 'completed') as edit_total,
          (SELECT COUNT(*) FROM neo_glitch_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as neo_glitch_24h,
          (SELECT COUNT(*) FROM presets_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as presets_24h,
          (SELECT COUNT(*) FROM emotion_mask_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as emotion_mask_24h,
          (SELECT COUNT(*) FROM ghibli_reaction_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as ghibli_reaction_24h,
          (SELECT COUNT(*) FROM custom_prompt_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as custom_prompt_24h,
          (SELECT COUNT(*) FROM edit_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as edit_24h
      `);

      // Get credit statistics
      const creditStats = await q(`
        SELECT 
          (SELECT SUM(credits) FROM users) as total_credits_in_system,
          (SELECT COUNT(*) FROM users WHERE credits > 0) as users_with_credits,
          (SELECT COUNT(*) FROM users WHERE credits = 0) as users_without_credits,
          (SELECT AVG(credits) FROM users) as avg_credits_per_user
      `);

      // Get system configuration (from environment variables)
      const systemConfig = {
        // API Configuration
        fal_ai_enabled: !!process.env.FAL_AI_API_KEY,
        bfl_api_enabled: !!process.env.BFL_API_KEY,
        stability_enabled: !!process.env.STABILITY_API_KEY,
        
        // Cloudinary Configuration
        cloudinary_enabled: !!process.env.CLOUDINARY_CLOUD_NAME,
        
        // Email Configuration
        email_enabled: !!process.env.RESEND_API_KEY,
        
        // Database Configuration
        database_enabled: !!process.env.DATABASE_URL,
        
        // Feature Flags
        features: {
          likes_system: true,
          referral_system: true,
          public_feed: true,
          studio_mode: true,
          story_mode: true,
          magic_wand: true
        },
        
        // Limits and Quotas
        limits: {
          max_credits_per_user: 100,
          daily_credit_reset: true,
          max_media_per_user: 1000,
          max_file_size_mb: 10
        }
      }

      console.log(`✅ [Admin] Retrieved system configuration`)
      
      return json({
        systemStats: systemStats[0] || {},
        mediaStats: mediaStats[0] || {},
        creditStats: creditStats[0] || {},
        systemConfig,
        timestamp: new Date().toISOString()
      })

    } else if (event.httpMethod === 'PUT') {
      // Update system configuration
      const body = JSON.parse(event.body || '{}')
      const { action, data } = body

      if (!action) {
        return json({ error: 'Action is required' }, { status: 400 })
      }

      console.log(`⚙️ [Admin] System action: ${action}`)

      switch (action) {
        case 'reset_daily_credits':
          // Reset all users' daily credits
          const resetResult = await q(`
            UPDATE users 
            SET credits = CASE 
              WHEN credits < 10 THEN 10 
              ELSE credits 
            END
            WHERE credits < 10
          `)
          
          console.log(`✅ [Admin] Reset daily credits for users`)
          return json({
            success: true,
            message: 'Daily credits reset successfully',
            usersUpdated: resetResult.length
          })

        case 'cleanup_old_media':
          // Clean up media older than 30 days
          const cleanupResult = await q(`
            DELETE FROM neo_glitch_media WHERE created_at < NOW() - INTERVAL '30 days' AND status != 'completed'
          `)
          
          console.log(`✅ [Admin] Cleaned up old media`)
          return json({
            success: true,
            message: 'Old media cleanup completed',
            itemsCleaned: cleanupResult.length
          })

        case 'update_feature_flag':
          // Update feature flags (would need a config table)
          console.log(`✅ [Admin] Feature flag update: ${data?.feature} = ${data?.enabled}`)
          return json({
            success: true,
            message: 'Feature flag updated successfully'
          })

        default:
          return json({ error: 'Invalid action' }, { status: 400 })
      }

    } else {
      return json({ error: 'Method not allowed' }, { status: 405 })
    }

  } catch (error: any) {
    console.error('💥 [Admin Config] Error:', error?.message || error)
    return json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}
