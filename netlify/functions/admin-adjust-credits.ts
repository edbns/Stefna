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
    const { userId, adjustment } = body

    if (!userId || typeof adjustment !== 'number') {
      return json({ error: 'Invalid request body' }, { status: 400 })
    }

    console.log(`💰 [Admin] Adjusting credits for user ${userId}: ${adjustment > 0 ? '+' : ''}${adjustment}`)

    // Get current user credits
    const currentCredits = await prisma.userCredits.findUnique({
      where: { userId },
      select: { credits: true }
    })

    if (!currentCredits) {
      return json({ error: 'User credits not found' }, { status: 404 })
    }

    const newCredits = Math.max(0, currentCredits.credits + adjustment)

    // Update user credits
    await prisma.userCredits.update({
      where: { userId },
      data: { credits: newCredits }
    })

    // Create audit log entry
    await prisma.creditTransaction.create({
      data: {
        id: `admin-adjust-${Date.now()}`,
        userId: userId,
        amount: adjustment,
        reason: `Admin credit adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`,
        env: 'production'
      }
    })

    console.log(`✅ [Admin] Credits adjusted successfully. New balance: ${newCredits}`)

    return json({
      success: true,
      message: 'Credits adjusted successfully',
      userId,
      adjustment,
      previousCredits: currentCredits.credits,
      newCredits,
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('❌ [Admin] Error adjusting credits:', e)
    return json({ error: 'Failed to adjust credits' }, { status: 500 })
  } finally {
    await prisma.$disconnect();
  }
}
