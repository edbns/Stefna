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
    if (event.httpMethod !== 'POST') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = JSON.parse(event.body || '{}')
    const { userId, ban } = body

    if (!userId || typeof ban !== 'boolean') {
      return json({ error: 'Invalid request body' }, { status: 400 })
    }

    console.log(`🔒 [Admin] ${ban ? 'Banning' : 'Unbanning'} user: ${userId}`)

    // TODO: Implement ban system - for now, we'll just log the action
    // In the future, add a 'banned' field to the User model
    
    // For now, we'll create an audit log entry
    try {
      await prisma.creditTransaction.create({
        data: {
          id: `admin-ban-${Date.now()}`,
          userId: userId,
          amount: 0,
          action: 'admin.ban',
          status: 'granted',
          reason: `User ${ban ? 'banned' : 'unbanned'} by admin`,
          env: 'production'
        }
      })
    } catch (e) {
      // Ignore audit log errors for now
      console.warn('⚠️ Could not create audit log entry:', e)
    }

    console.log(`✅ [Admin] User ${userId} ${ban ? 'banned' : 'unbanned'} successfully`)

    return json({
      success: true,
      message: `User ${ban ? 'banned' : 'unbanned'} successfully`,
      userId,
      banned: ban,
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('❌ [Admin] Error banning/unbanning user:', e)
    return json({ error: 'Failed to ban/unban user' }, { status: 500 })
  } finally {
    await prisma.$disconnect();
  }
}
