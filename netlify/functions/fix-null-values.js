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

    if (action !== 'fix-null-values') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) }
    }

    console.log(`🔧 Fixing null values for user ${userId}, setting env to: ${env}`)

    // Find all images with null env or visibility for this user
    const { data: nullImages, error: findError } = await supabase
      .from('media_assets')
      .select('id, env, visibility, created_at')
      .eq('user_id', userId)
      .or('env.is.null,visibility.is.null')

    if (findError) {
      console.error('❌ Find null values error:', findError)
      return { statusCode: 500, body: JSON.stringify({ error: findError.message }) }
    }

    if (!nullImages || nullImages.length === 0) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          message: 'No null values found to fix',
          fixed: 0 
        }) 
      }
    }

    console.log(`📊 Found ${nullImages.length} images with null values to fix`)

    // Fix all null values: set env and make private (safer default)
    const { data: fixed, error: fixError } = await supabase
      .from('media_assets')
      .update({ 
        env: env,
        visibility: 'private', // Safer default - user can then choose to share
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .or('env.is.null,visibility.is.null')
      .select('id, env, visibility, updated_at')

    if (fixError) {
      console.error('❌ Fix null values error:', fixError)
      return { statusCode: 500, body: JSON.stringify({ error: fixError.message }) }
    }

    console.log(`✅ Successfully fixed ${fixed?.length || 0} images with null values`)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `Fixed ${fixed?.length || 0} images with null values`,
        fixed: fixed?.length || 0,
        items: fixed
      })
    }

  } catch (e) {
    console.error('❌ Fix null values error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Internal server error' }) 
    }
  }
}
