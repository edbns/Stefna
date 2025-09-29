import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';
import { withAdminSecurity } from './_lib/adminSecurity';
import { handleCORS, getAdminCORSHeaders } from './_lib/cors';



const adminUsersHandler: Handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event, true); // true for admin
  if (corsResponse) return corsResponse;

  try {
    if (event.httpMethod !== 'GET') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    console.log('🔍 [Admin] Fetching all users and stats...')

    // Fetch all users with their settings, credits, and last activity
    const users = await q(`
      SELECT u.id, u.email, u.name, u.created_at, u.updated_at,
             us.share_to_feed, us.media_upload_agreed, uc.credits,
             GREATEST(
               u.updated_at,
               COALESCE((SELECT MAX(created_at) FROM edit_media WHERE user_id = u.id), '1970-01-01'::timestamp),
               COALESCE((SELECT MAX(created_at) FROM unreal_reflection_media WHERE user_id = u.id), '1970-01-01'::timestamp),
               COALESCE((SELECT MAX(created_at) FROM ghibli_reaction_media WHERE user_id = u.id), '1970-01-01'::timestamp)
             ) as last_active
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
      lastActive: user.last_active,
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

    // Count total media (all types) - only count existing tables
    let totalMediaCount = 0
    
    try {
      // Count edit_media (current active table)
      const editMediaCount = await qCount(`SELECT COUNT(*) FROM edit_media`)
      totalMediaCount += editMediaCount
    } catch (e) {
      console.log('⚠️ [Admin] edit_media table not found')
    }
    
    try {
      // Count unreal_reflection_media
      const unrealReflectionCount = await qCount(`SELECT COUNT(*) FROM unreal_reflection_media`)
      totalMediaCount += unrealReflectionCount
    } catch (e) {
      console.log('⚠️ [Admin] unreal_reflection_media table not found')
    }
    
    try {
      // Count ghibli_reaction_media
      const ghibliCount = await qCount(`SELECT COUNT(*) FROM ghibli_reaction_media`)
      totalMediaCount += ghibliCount
    } catch (e) {
      console.log('⚠️ [Admin] ghibli_reaction_media table not found')
    }

    stats.totalMedia = totalMediaCount

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

// Export with admin security middleware
export const handler = withAdminSecurity(adminUsersHandler);
