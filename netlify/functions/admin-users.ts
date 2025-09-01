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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    if (event.httpMethod !== 'GET') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 [Admin] Fetching all users and stats...')

    // Fetch all users with their settings and credits
    const users = await q(`
      SELECT u.id, u.email, u.name, u.created_at, u.updated_at,
             us.share_to_feed, us.media_upload_agreed, uc.credits
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      LEFT JOIN user_credits uc ON u.id = uc.user_id
      ORDER BY u.created_at DESC
    `)

    // Transform users data
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      credits: user.credits || 0,
      isBanned: false, // TODO: Add ban field to user model
      shareToFeed: user.share_to_feed || false,
      mediaUploadAgreed: user.media_upload_agreed || false
    }))

    // Calculate stats
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => !u.userSettings?.shareToFeed).length,
      bannedUsers: 0, // TODO: Implement ban system
      totalCredits: transformedUsers.reduce((sum, user) => sum + user.credits, 0),
      totalMedia: 0 // TODO: Count all media types
    }

    // Count total media (all types)
    const [
      neoGlitchCount,
      ghibliCount,
      emotionMaskCount,
      presetsCount,
      customPromptCount,
      storyCount
    ] = await Promise.all([
      qCount(`SELECT COUNT(*) FROM neo_glitch_media`),
      qCount(`SELECT COUNT(*) FROM ghibli_reaction_media`),
      qCount(`SELECT COUNT(*) FROM emotion_mask_media`),
      qCount(`SELECT COUNT(*) FROM presets_media`),
      qCount(`SELECT COUNT(*) FROM custom_prompt_media`),
      qCount(`SELECT COUNT(*) FROM story`)
    ])

    stats.totalMedia = neoGlitchCount + ghibliCount + emotionMaskCount + presetsCount + customPromptCount + storyCount

    console.log(`✅ [Admin] Retrieved ${users.length} users and stats`)

    return json({
      users: transformedUsers,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('❌ [Admin] Error fetching users:', e)
    return json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
