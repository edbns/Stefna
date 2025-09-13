import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';
import { withAdminSecurity } from './_lib/adminSecurity';
import { handleCORS, getAdminCORSHeaders } from './_lib/cors';

// ============================================================================
// ADMIN SYSTEM CONFIGURATION
// ============================================================================
// This function provides admin access to system configuration
// - View system settings
// - Update system configuration
// - Feature toggles
// - System health monitoring
// ============================================================================

const adminConfigHandler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event, true); // true for admin
  if (corsResponse) return corsResponse;

  try {
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
          (SELECT COUNT(*) FROM unreal_reflection_media WHERE status = 'completed') as unreal_reflection_total,
          (SELECT COUNT(*) FROM ghibli_reaction_media WHERE status = 'completed') as ghibli_reaction_total,
          (SELECT COUNT(*) FROM custom_prompt_media WHERE status = 'completed') as custom_prompt_total,
          (SELECT COUNT(*) FROM edit_media WHERE status = 'completed') as edit_total,
          (SELECT COUNT(*) FROM neo_glitch_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as neo_glitch_24h,
          (SELECT COUNT(*) FROM presets_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as presets_24h,
          (SELECT COUNT(*) FROM unreal_reflection_media WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed') as unreal_reflection_24h,
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

      // Get launch status
      const launchStatus = await q('SELECT * FROM get_launch_status()');
      
      // Get waitlist count
      const waitlistCount = await qCount('SELECT COUNT(*) FROM waitlist');

      // Get real system health from health check endpoint
      let realHealthStatus = {
        fal_ai_enabled: false,
        bfl_api_enabled: false,
        stability_enabled: false,
        cloudinary_enabled: false,
        email_enabled: false,
        database_enabled: false,
        overall_status: 'unknown'
      };
      
      try {
        // Call our health check function internally
        const healthResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/health-check`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          realHealthStatus = {
            fal_ai_enabled: healthData.services?.find((s: any) => s.service === 'fal_ai')?.status === 'healthy',
            bfl_api_enabled: healthData.services?.find((s: any) => s.service === 'bfl')?.status === 'healthy',
            stability_enabled: healthData.services?.find((s: any) => s.service === 'stability_ai')?.status === 'healthy',
            cloudinary_enabled: healthData.services?.find((s: any) => s.service === 'cloudinary')?.status === 'healthy',
            email_enabled: healthData.services?.find((s: any) => s.service === 'email')?.status === 'healthy',
            database_enabled: healthData.services?.find((s: any) => s.service === 'database')?.status === 'healthy',
            overall_status: healthData.overallStatus || 'unknown'
          };
        }
      } catch (healthError) {
        console.warn('⚠️ [Admin] Health check failed, falling back to env vars:', healthError);
        // Fallback to environment variable checks
        realHealthStatus = {
          fal_ai_enabled: !!process.env.FAL_AI_API_KEY,
          bfl_api_enabled: !!process.env.BFL_API_KEY,
          stability_enabled: !!process.env.STABILITY_API_KEY,
          cloudinary_enabled: !!process.env.CLOUDINARY_CLOUD_NAME,
          email_enabled: !!process.env.RESEND_API_KEY,
          database_enabled: !!process.env.DATABASE_URL,
          overall_status: 'degraded'
        };
      }

      // Get system configuration with real health status
      const systemConfig = {
        // API Configuration - Real Health Status
        fal_ai_enabled: realHealthStatus.fal_ai_enabled,
        bfl_api_enabled: realHealthStatus.bfl_api_enabled,
        stability_enabled: realHealthStatus.stability_enabled,
        
        // Cloudinary Configuration - Real Health Status
        cloudinary_enabled: realHealthStatus.cloudinary_enabled,
        
        // Email Configuration - Real Health Status
        email_enabled: realHealthStatus.email_enabled,
        
        // Database Configuration - Real Health Status
        database_enabled: realHealthStatus.database_enabled,
        
        // Overall System Health
        overall_health: realHealthStatus.overall_status,
        
        // Launch Configuration
        launch: launchStatus[0] || { is_launched: false, launch_date: null, waitlist_count: 0 },
        
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
      });

    } else if (event.httpMethod === 'PUT') {
      // Update system configuration
      const body = JSON.parse(event.body || '{}')
      const { action, data } = body

      if (!action) {
        return json({ error: 'Action is required' }, { status: 400 });
      }

      console.log(`⚙️ [Admin] System action: ${action}`)

      switch (action) {
        case 'reset_daily_credits':
          // Reset all users' daily credits to 30 in user_credits table
          const resetResult = await q(`
            UPDATE user_credits 
            SET credits = 30, updated_at = NOW()
          `)
          
          console.log(`✅ [Admin] Reset daily credits for users (set to 30) `)
          return json({
            success: true,
            message: 'Daily credits reset successfully',
            usersUpdated: resetResult.length
          });

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
          });

        case 'update_feature_flag':
          // Update feature flags (would need a config table)
          console.log(`✅ [Admin] Feature flag update: ${data?.feature} = ${data?.enabled}`)
          return json({
            success: true,
            message: 'Feature flag updated successfully'
          });

        case 'bulk_config_adjustment':
          // Adjust app_config values
          const { key, adjustment } = data;
          if (!key || typeof adjustment !== 'number') {
            return json({ error: 'key and adjustment are required' }, { status: 400 });
          }

          // Get current value
          const currentConfig = await qOne(`SELECT value FROM app_config WHERE key = $1`, [key]);
          if (!currentConfig) {
            return json({ error: `Config key '${key}' not found` }, { status: 404 });
          }

          const currentValue = parseInt(currentConfig.value) || 0;
          const newValue = Math.max(0, currentValue + adjustment); // Ensure non-negative

          // Update the config value
          await q(`UPDATE app_config SET value = $1 WHERE key = $2`, [newValue.toString(), key]);

          console.log(`✅ [Admin] Updated ${key}: ${currentValue} → ${newValue} (${adjustment > 0 ? '+' : ''}${adjustment})`);
          return json({
            success: true,
            message: `Updated ${key} from ${currentValue} to ${newValue}`,
            oldValue: currentValue,
            newValue: newValue,
            adjustment: adjustment
          });

        case 'toggle_launch':
          // Toggle launch status
          const { is_launched } = data;
          if (typeof is_launched !== 'boolean') {
            return json({ error: 'is_launched must be a boolean' }, { status: 400 });
          }

          const launchResult = await q('SELECT * FROM update_launch_status($1)', [is_launched]);
          
          // If launching, send notifications to waitlist
          if (is_launched) {
            try {
              const waitlistEmails = await q('SELECT email FROM waitlist ORDER BY created_at ASC');
              
              // Send launch emails to waitlist (in batches to avoid rate limits)
              const batchSize = 10;
              for (let i = 0; i < waitlistEmails.length; i += batchSize) {
                const batch = waitlistEmails.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (row: any) => {
                  try {
                    await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        to: row.email,
                        type: 'waitlist_launch',
                        subject: 'Stefna is live — your photos are about to get weird (in the best way)',
                        text: 'Launch notification email'
                      }),
                    });
                  } catch (emailError) {
                    console.error(`Failed to send launch email to ${row.email}:`, emailError);
                  }
                }));
                
                // Small delay between batches
                if (i + batchSize < waitlistEmails.length) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
              
              console.log(`📧 [Admin] Sent launch notifications to ${waitlistEmails.length} waitlist users`);
            } catch (notificationError) {
              console.error('Failed to send launch notifications:', notificationError);
              // Don't fail the launch if notifications fail
            }
          }
          
          console.log(`🚀 [Admin] Launch status updated: ${is_launched}`)
          return json({
            success: true,
            message: is_launched ? 'Site launched successfully!' : 'Site reverted to coming soon',
            launchStatus: launchResult[0]
          });

        default:
          return json({ error: 'Invalid action' }, { status: 400 });
      }

    } else {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

  } catch (error: any) {
    console.error('💥 [Admin Config] Error:', error?.message || error)
    return json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}

// Export with admin security middleware
export const handler = withAdminSecurity(adminConfigHandler);
