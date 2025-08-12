const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    // Verify user authentication
    const { userId } = verifyAuth(event)
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const body = JSON.parse(event.body || '{}')
    const { action, env = 'prod' } = body

    if (action !== 'bulk-share') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) }
    }

    console.log(`🔄 Bulk share requested by user ${userId} for env: ${env}`)

    // Get count of user's media that could be shared
    const { data: mediaToUpdate, error: countError } = await supabase
      .from('media_assets')
      .select('id, visibility, env')
      .eq('user_id', userId)
      .or(`visibility.neq.public,env.neq.${env}`)

    if (countError) {
      console.error('❌ Count query error:', countError)
      return { statusCode: 500, body: JSON.stringify({ error: countError.message }) }
    }

    if (!mediaToUpdate || mediaToUpdate.length === 0) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          message: 'No media items to update',
          updated: 0 
        }) 
      }
    }

    console.log(`📊 Found ${mediaToUpdate.length} items to update`)

    // Bulk update all user's media to public and correct env
    const { data: updated, error: updateError } = await supabase
      .from('media_assets')
      .update({ 
        visibility: 'public', 
        env: env,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .or(`visibility.neq.public,env.neq.${env}`)
      .select('id, visibility, env, updated_at')

    if (updateError) {
      console.error('❌ Bulk update error:', updateError)
      return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) }
    }

    console.log(`✅ Successfully updated ${updated?.length || 0} media items`)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `Successfully made ${updated?.length || 0} items public`,
        updated: updated?.length || 0,
        items: updated
      })
    }

  } catch (e) {
    console.error('❌ Bulk share error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Internal server error' }) 
    }
  }
}
