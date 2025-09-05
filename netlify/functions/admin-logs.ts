import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';

// ============================================================================
// ADMIN LOGS & ANALYTICS
// ============================================================================
// This function provides admin access to system logs and analytics
// - View system logs
// - User activity analytics
// - Error monitoring
// - Performance metrics
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
      // Get logs and analytics data
      const { type = 'activity', limit = '100', offset = '0', days = '7' } = event.queryStringParameters || {}
      
      // Ensure valid numbers
      const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 100));
      const offsetNum = Math.max(0, parseInt(offset) || 0);
      const daysNum = Math.max(1, Math.min(30, parseInt(days) || 7));
      
      console.log('🔍 [Admin] Fetching logs and analytics:', { type, limit: limitNum, offset: offsetNum, days: daysNum })
      
      let logs = []
      let analytics = {}

      if (type === 'activity') {
        // Get user activity logs
        logs = await q(`
          SELECT 
            'user_activity' as log_type,
            u.email as user_email,
            u.id as user_id,
            u.created_at as timestamp,
            'user_created' as action,
            'User account created' as description
          FROM users u
          WHERE u.created_at >= NOW() - INTERVAL '${days} days'
          
          UNION ALL
          
          SELECT 
            'media_generation' as log_type,
            u.email as user_email,
            u.id as user_id,
            nm.created_at as timestamp,
            'media_generated' as action,
            CONCAT('Generated ', nm.preset, ' media') as description
          FROM neo_glitch_media nm
          JOIN users u ON nm.user_id = u.id
          WHERE nm.created_at >= NOW() - INTERVAL '${days} days' AND nm.status = 'completed'
          
          UNION ALL
          
          SELECT 
            'media_generation' as log_type,
            u.email as user_email,
            u.id as user_id,
            pm.created_at as timestamp,
            'media_generated' as action,
            CONCAT('Generated ', pm.preset, ' media') as description
          FROM presets_media pm
          JOIN users u ON pm.user_id = u.id
          WHERE pm.created_at >= NOW() - INTERVAL '${days} days' AND pm.status = 'completed'
          
          UNION ALL
          
          SELECT 
            'media_generation' as log_type,
            u.email as user_email,
            u.id as user_id,
            em.created_at as timestamp,
            'media_generated' as action,
            'Generated emotion mask media' as description
          FROM emotion_mask_media em
          JOIN users u ON em.user_id = u.id
          WHERE em.created_at >= NOW() - INTERVAL '${days} days' AND em.status = 'completed'
          
          UNION ALL
          
          SELECT 
            'media_generation' as log_type,
            u.email as user_email,
            u.id as user_id,
            gm.created_at as timestamp,
            'media_generated' as action,
            'Generated ghibli reaction media' as description
          FROM ghibli_reaction_media gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.created_at >= NOW() - INTERVAL '${days} days' AND gm.status = 'completed'
          
          UNION ALL
          
          SELECT 
            'media_generation' as log_type,
            u.email as user_email,
            u.id as user_id,
            cm.created_at as timestamp,
            'media_generated' as action,
            'Generated custom prompt media' as description
          FROM custom_prompt_media cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.created_at >= NOW() - INTERVAL '${days} days' AND cm.status = 'completed'
          
          UNION ALL
          
          SELECT 
            'media_generation' as log_type,
            u.email as user_email,
            u.id as user_id,
            em.created_at as timestamp,
            'media_generated' as action,
            'Generated studio media' as description
          FROM edit_media em
          JOIN users u ON em.user_id = u.id
          WHERE em.created_at >= NOW() - INTERVAL '${days} days' AND em.status = 'completed'
          
          UNION ALL
          
          SELECT 
            'user_interaction' as log_type,
            u.email as user_email,
            u.id as user_id,
            l.created_at as timestamp,
            'like_added' as action,
            'User liked media' as description
          FROM likes l
          JOIN users u ON l.user_id = u.id
          WHERE l.created_at >= NOW() - INTERVAL '${days} days'
          
          ORDER BY timestamp DESC
          LIMIT $1 OFFSET $2
        `, [limitNum, offsetNum])

        // Get activity analytics
        analytics = await q(`
          SELECT 
            COUNT(DISTINCT u.id) as active_users,
            COUNT(DISTINCT nm.user_id) as users_generated_neo_glitch,
            COUNT(DISTINCT pm.user_id) as users_generated_presets,
            COUNT(DISTINCT em.user_id) as users_generated_emotion_mask,
            COUNT(DISTINCT gm.user_id) as users_generated_ghibli_reaction,
            COUNT(DISTINCT cm.user_id) as users_generated_custom_prompt,
            COUNT(DISTINCT edm.user_id) as users_generated_studio,
            COUNT(DISTINCT l.user_id) as users_liked_media,
            COUNT(nm.id) as neo_glitch_generated,
            COUNT(pm.id) as presets_generated,
            COUNT(em.id) as emotion_mask_generated,
            COUNT(gm.id) as ghibli_reaction_generated,
            COUNT(cm.id) as custom_prompt_generated,
            COUNT(edm.id) as studio_generated,
            COUNT(l.id) as likes_given
          FROM users u
          LEFT JOIN neo_glitch_media nm ON u.id = nm.user_id AND nm.created_at >= NOW() - INTERVAL '${days} days' AND nm.status = 'completed'
          LEFT JOIN presets_media pm ON u.id = pm.user_id AND pm.created_at >= NOW() - INTERVAL '${days} days' AND pm.status = 'completed'
          LEFT JOIN emotion_mask_media em ON u.id = em.user_id AND em.created_at >= NOW() - INTERVAL '${days} days' AND em.status = 'completed'
          LEFT JOIN ghibli_reaction_media gm ON u.id = gm.user_id AND gm.created_at >= NOW() - INTERVAL '${days} days' AND gm.status = 'completed'
          LEFT JOIN custom_prompt_media cm ON u.id = cm.user_id AND cm.created_at >= NOW() - INTERVAL '${days} days' AND cm.status = 'completed'
          LEFT JOIN edit_media edm ON u.id = edm.user_id AND edm.created_at >= NOW() - INTERVAL '${days} days' AND edm.status = 'completed'
          LEFT JOIN likes l ON u.id = l.user_id AND l.created_at >= NOW() - INTERVAL '${days} days'
          WHERE u.created_at >= NOW() - INTERVAL '${days} days'
        `)

      } else if (type === 'errors') {
        // Get error logs (would need an error logging table)
        logs = await q(`
          SELECT 
            'system_error' as log_type,
            'System' as user_email,
            'system' as user_id,
            NOW() as timestamp,
            'error' as action,
            'No error logging table implemented yet' as description
          LIMIT 1
        `)
        
        analytics = {
          total_errors: 0,
          errors_24h: 0,
          errors_7d: 0,
          most_common_error: 'No error logging implemented'
        }

      } else if (type === 'performance') {
        // Get performance metrics
        logs = await q(`
          SELECT 
            'performance' as log_type,
            'System' as user_email,
            'system' as user_id,
            NOW() as timestamp,
            'metric' as action,
            'Performance monitoring not implemented yet' as description
          LIMIT 1
        `)
        
        analytics = {
          avg_response_time: 'N/A',
          requests_per_minute: 'N/A',
          error_rate: '0%',
          uptime: '100%'
        }
      }

      // Get total count for pagination
      const totalCount = await q(`
        SELECT COUNT(*) as total FROM (
          SELECT u.id FROM users u
          WHERE u.created_at >= NOW() - INTERVAL '${days} days'
          UNION ALL
          SELECT nm.user_id FROM neo_glitch_media nm
          WHERE nm.created_at >= NOW() - INTERVAL '${days} days' AND nm.status = 'completed'
          UNION ALL
          SELECT pm.user_id FROM presets_media pm
          WHERE pm.created_at >= NOW() - INTERVAL '${days} days' AND pm.status = 'completed'
          UNION ALL
          SELECT em.user_id FROM emotion_mask_media em
          WHERE em.created_at >= NOW() - INTERVAL '${days} days' AND em.status = 'completed'
          UNION ALL
          SELECT gm.user_id FROM ghibli_reaction_media gm
          WHERE gm.created_at >= NOW() - INTERVAL '${days} days' AND gm.status = 'completed'
          UNION ALL
          SELECT cm.user_id FROM custom_prompt_media cm
          WHERE cm.created_at >= NOW() - INTERVAL '${days} days' AND cm.status = 'completed'
          UNION ALL
          SELECT edm.user_id FROM edit_media edm
          WHERE edm.created_at >= NOW() - INTERVAL '${days} days' AND edm.status = 'completed'
          UNION ALL
          SELECT l.user_id FROM likes l
          WHERE l.created_at >= NOW() - INTERVAL '${days} days'
        ) activity_logs
      `)

      console.log(`✅ [Admin] Retrieved ${logs.length} log entries`)
      
      return json({
        logs,
        analytics: Array.isArray(analytics) ? analytics[0] || {} : analytics,
        total: totalCount[0]?.total || 0,
        type,
        days: daysNum,
        limit: limitNum,
        offset: offsetNum,
        timestamp: new Date().toISOString()
      })

    } else {
      return json({ error: 'Method not allowed' }, { status: 405 })
    }

  } catch (error: any) {
    console.error('💥 [Admin Logs] Error:', error?.message || error)
    return json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}
