const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('🔍 Debug: Checking media_assets table...')

    // Check total count
    const { count: totalCount, error: countError } = await supabase
      .from('media_assets')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Count error:', countError)
      return { statusCode: 500, body: JSON.stringify({ error: countError.message }) }
    }

    // Check by visibility
    const { data: publicMedia, error: publicError } = await supabase
      .from('media_assets')
      .select('id,visibility,env,created_at,user_id')
      .eq('visibility', 'public')
      .limit(10)

    if (publicError) {
      console.error('❌ Public media error:', publicError)
      return { statusCode: 500, body: JSON.stringify({ error: publicError.message }) }
    }

    // Check by environment
    const { data: prodMedia, error: prodError } = await supabase
      .from('media_assets')
      .select('id,visibility,env,created_at,user_id')
      .eq('env', 'prod')
      .limit(10)

    if (prodError) {
      console.error('❌ Prod media error:', prodError)
      return { statusCode: 500, body: JSON.stringify({ error: prodError.message }) }
    }

    // Check your specific media (if you provide user_id)
    const { data: userMedia, error: userError } = await supabase
      .from('media_assets')
      .select('id,visibility,env,created_at,user_id,prompt')
      .order('created_at', { ascending: false })
      .limit(20)

    if (userError) {
      console.error('❌ User media error:', userError)
      return { statusCode: 500, body: JSON.stringify({ error: userError.message }) }
    }

    const debugInfo = {
      totalCount,
      publicCount: publicMedia?.length || 0,
      prodCount: prodMedia?.length || 0,
      publicMedia: publicMedia?.slice(0, 5) || [],
      prodMedia: prodMedia?.slice(0, 5) || [],
      recentMedia: userMedia?.slice(0, 10) || [],
      environment: {
        PUBLIC_APP_ENV: process.env.PUBLIC_APP_ENV,
        NODE_ENV: process.env.NODE_ENV
      }
    }

    console.log('🔍 Debug info:', debugInfo)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(debugInfo)
    }

  } catch (e) {
    console.error('❌ Debug function error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Debug function crashed' }) 
    }
  }
}

