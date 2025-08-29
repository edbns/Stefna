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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE'
      }
    };
  }

  try {
    if (event.httpMethod !== 'DELETE') {
      return json({ error: 'Method Not Allowed' }, { status: 405 })
    }

    // Verify admin access
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = JSON.parse(event.body || '{}')
    const { userId } = body

    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 })
    }

    console.log(`🗑️ [Admin] Deleting user and all associated data: ${userId}`)

    // Start a transaction to delete all user data
    await q($transaction(async (tx) => {
      // Delete all media types
      await tx.neoGlitchMedia.deleteMany({ where: { userId } })
      await tx.ghibliReactionMedia.deleteMany({ where: { userId } })
      await tx.emotionMaskMedia.deleteMany({ where: { userId } })
      await tx.presetsMedia.deleteMany({ where: { userId } })
      await tx.customPromptMedia.deleteMany({ where: { userId } })
      await tx.story.deleteMany({ where: { userId } })
      
      // Delete user settings
      await tx.userSettings.deleteMany({ where: { userId } })
      
      // Delete user credits
      await tx.userCredits.deleteMany({ where: { userId } })
      
      // Delete credit transactions
      await tx.creditTransaction.deleteMany({ where: { userId } })
      
      // Delete OTP records
      await tx.authOtp.deleteMany({ where: { email: { contains: userId } } })
      
      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    console.log(`✅ [Admin] User ${userId} and all associated data deleted successfully`)

    return json({
      success: true,
      message: 'User deleted successfully',
      userId,
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('❌ [Admin] Error deleting user:', e)
    return json({ error: 'Failed to delete user' }, { status: 500 })
  } finally {
    
  }
}
