import type { Handler } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

// ---- Database connection ----
const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    // Auth check using JWT
    const { userId } = requireAuth(event.headers.authorization)
    if (!userId) {
      return json({ error: 'Unauthorized - Invalid or missing JWT token' }, { status: 401 })
    }

    if (event.httpMethod === 'GET') {
      // Get user settings
      console.log(`📥 Getting settings for user: ${userId}`)
      
      try {
        const settings = await prisma.userSettings.findUnique({
          where: { userId },
          select: { shareToFeed: true, allowRemix: true, mediaUploadAgreed: true, updatedAt: true }
        });

        // Return default settings if none exist
        const defaultSettings = {
          shareToFeed: false,      // 🔒 PRIVACY FIRST: Default to private
          allowRemix: true,        // Default to allowing remixes
          mediaUploadAgreed: false, // Default to showing agreement
          updatedAt: null
        }

        const result = settings || defaultSettings
        console.log(`✅ Retrieved settings for user ${userId}:`, result)

        return json({
          shareToFeed: result.shareToFeed,
          allowRemix: result.allowRemix,
          mediaUploadAgreed: result.mediaUploadAgreed,
          updatedAt: result.updatedAt
        })
      } catch (dbError) {
        console.error('❌ Get settings error:', dbError)
        // Return default settings on error
        return json({
          shareToFeed: false,  // 🔒 PRIVACY FIRST: Default to private
          updatedAt: null
        })
      }
    }

    if (event.httpMethod === 'POST') {
      // Update user settings
      const body = JSON.parse(event.body || '{}')
      const { shareToFeed, allowRemix, mediaUploadAgreed } = body

      // Validate required fields
      if (typeof shareToFeed !== 'boolean') {
        return json({ error: 'shareToFeed must be boolean' }, { status: 400 })
      }
      if (allowRemix !== undefined && typeof allowRemix !== 'boolean') {
        return json({ error: 'allowRemix must be boolean' }, { status: 400 })
      }
      if (mediaUploadAgreed !== undefined && typeof mediaUploadAgreed !== 'boolean') {
        return json({ error: 'mediaUploadAgreed must be boolean' }, { status: 400 })
      }

      console.log(`📝 Updating settings for user ${userId}:`, { shareToFeed, allowRemix, mediaUploadAgreed })

      try {
        // Upsert settings (create if doesn't exist, update if it does)
        const updated = await prisma.userSettings.upsert({
          where: { userId },
          update: { 
            shareToFeed,
            ...(allowRemix !== undefined && { allowRemix }),
            ...(mediaUploadAgreed !== undefined && { mediaUploadAgreed }),
            updatedAt: new Date()
          },
          create: {
            id: `settings-${userId}`,
            userId,
            shareToFeed,
            allowRemix: allowRemix ?? true, // Use provided value or default
            mediaUploadAgreed: mediaUploadAgreed ?? false, // Use provided value or default
            updatedAt: new Date()
          }
        });

        console.log(`✅ Updated settings for user ${userId}:`, updated)

        return json({
          shareToFeed: updated.shareToFeed,
          allowRemix: updated.allowRemix,
          mediaUploadAgreed: updated.mediaUploadAgreed,
          updatedAt: updated.updatedAt
        })
      } catch (dbError) {
        console.error('❌ Update settings error:', dbError)
        return json({ error: 'Failed to update settings' }, { status: 500 })
      }
    }

    // This should never be reached, but TypeScript needs it
    return json({ error: 'Method not implemented' }, { status: 501 })

  } catch (e) {
    console.error('❌ user-settings error:', e)
    return json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect();
  }
}
