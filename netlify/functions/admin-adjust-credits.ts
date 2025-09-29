import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { json } from './_lib/http';
import { withAdminSecurity } from './_lib/adminSecurity';



const adminAdjustCreditsHandler: Handler = async (event) => {
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
    const currentCredits = await qOne(`
      SELECT credits FROM user_credits WHERE user_id = $1
    `, [userId])

    if (!currentCredits) {
      return json({ error: 'User credits not found' }, { status: 404 })
    }

    const newCredits = Math.max(0, currentCredits.credits + adjustment)

    // Update user credits
    await q(`
      UPDATE user_credits SET credits = $1, updated_at = NOW() WHERE user_id = $2
    `, [newCredits, userId])

    // Create audit log entry
    await q(`
      INSERT INTO credits_ledger (id, user_id, amount, action, status, reason, env, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      `admin-adjust-${Date.now()}`,
      userId,
      adjustment,
      'admin.adjust',
      'granted',
      `Admin credit adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`,
      'production'
    ])

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
  }
}

export const handler = withAdminSecurity(adminAdjustCreditsHandler);
