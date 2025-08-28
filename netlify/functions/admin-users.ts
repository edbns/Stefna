import type { Handler } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { json } from './_lib/http';

const prisma = new PrismaClient();

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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        settings: {
          select: {
            shareToFeed: true,
            allowRemix: true,
            mediaUploadAgreed: true
          }
        },
        userCredits: {
          select: {
            credits: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform users data
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      credits: user.userCredits?.credits || 0,
      isBanned: false, // TODO: Add ban field to user model
      shareToFeed: user.settings?.shareToFeed || false,
      allowRemix: user.settings?.allowRemix || true,
      mediaUploadAgreed: user.settings?.mediaUploadAgreed || false
    }))

    // Calculate stats
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => !u.settings?.shareToFeed).length,
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
      prisma.neoGlitchMedia.count(),
      prisma.ghibliReactionMedia.count(),
      prisma.emotionMaskMedia.count(),
      prisma.presetsMedia.count(),
      prisma.customPromptMedia.count(),
      prisma.story.count()
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
  } finally {
    await prisma.$disconnect();
  }
}
