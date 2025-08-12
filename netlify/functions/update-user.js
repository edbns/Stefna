const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    // Verify user authentication
    const { userId } = verifyAuth(event)
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { name, avatar } = JSON.parse(event.body || '{}')

    if (!name && !avatar) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name or avatar required' }) }
    }

    console.log(`📝 Updating user ${userId}:`, { name, avatar })

    const updates = {}
    if (name) updates.name = name
    if (avatar) updates.avatar_url = avatar

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, avatar_url, updated_at')
      .single()

    if (error) {
      console.error('❌ Update user error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    console.log(`✅ User updated successfully:`, updated)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        user: updated 
      })
    }

  } catch (e) {
    console.error('❌ Update user error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Internal server error' }) 
    }
  }
}
