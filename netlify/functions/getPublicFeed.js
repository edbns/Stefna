const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    )

    const ENV = process.env.PUBLIC_APP_ENV || 'prod'
    const limit = Math.min(Number(event.queryStringParameters?.limit || 60), 200)

    console.log(`🌍 Feed query: env=${ENV}, limit=${limit}`)
    console.log(`🔍 Environment variables:`, {
      PUBLIC_APP_ENV: process.env.PUBLIC_APP_ENV,
      NODE_ENV: process.env.NODE_ENV,
      finalEnv: ENV
    })

    const { data, error, count } = await supabase
      .from('media_assets')
      .select('id,url,user_id,allow_remix,created_at,env,visibility,resource_type,prompt,mode,width,height,result_url,parent_asset_id,likes_count,remixes_count,user_avatar,user_tier', { count: 'exact' })
      .eq('visibility', 'public')
      .eq('env', ENV)                       // if debugging, temporarily comment this out
      .order('created_at', { ascending: false })
      .limit(limit)

    // Debug: Check what's in the database
    console.log(`🔍 Database query results:`, {
      totalCount: count,
      publicCount: data?.length || 0,
      envFilter: ENV,
      sampleItems: data?.slice(0, 3).map(item => ({
        id: item.id,
        visibility: item.visibility,
        env: item.env,
        created_at: item.created_at
      }))
    })

    if (error) {
      console.error('❌ Feed query error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    console.log(`✅ Feed returned: ${data?.length || 0} items, total count: ${count}`)
    
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count, limitUsed: limit, items: data ?? [] })
    }
  } catch (e) {
    console.error('❌ Feed handler error:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'feed error' }) 
    }
  }
}
