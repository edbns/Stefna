const { createClient } = require('@supabase/supabase-js')
const { verifyAuth } = require('./_auth')

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }

    const { userId } = verifyAuth(event)
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log(`🔄 Starting migration for user: ${userId}`)

    // Step 1: Get all user's media that needs migration
    const { data: userMedia, error: fetchError } = await supabase
      .from('media_assets')
      .select('id, visibility, env, created_at')
      .eq('user_id', userId)
      .in('env', ['dev', 'development'])
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Failed to fetch user media:', fetchError)
      return { statusCode: 500, body: JSON.stringify({ error: fetchError.message }) }
    }

    if (!userMedia || userMedia.length === 0) {
      console.log(`✅ No media found for user ${userId} that needs migration`)
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'No media needs migration',
          migratedCount: 0,
          totalUserMedia: 0
        })
      }
    }

    console.log(`📊 Found ${userMedia.length} media items to migrate for user ${userId}`)

    // Step 2: Start transaction - migrate media in batches
    const batchSize = 10
    const batches = []
    for (let i = 0; i < userMedia.length; i += batchSize) {
      batches.push(userMedia.slice(i, i + batchSize))
    }

    let totalMigrated = 0
    let totalErrors = 0
    const errors = []

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`)

      for (const media of batch) {
        try {
          // Update each media item individually for safety
          const { error: updateError } = await supabase
            .from('media_assets')
            .update({
              env: 'prod',
              updated_at: new Date().toISOString()
            })
            .eq('id', media.id)
            .eq('user_id', userId) // Extra safety check

          if (updateError) {
            console.error(`❌ Failed to migrate media ${media.id}:`, updateError)
            totalErrors++
            errors.push({ mediaId: media.id, error: updateError.message })
          } else {
            totalMigrated++
            console.log(`✅ Migrated media ${media.id} (${media.visibility} -> prod)`)
          }
        } catch (e) {
          console.error(`❌ Exception migrating media ${media.id}:`, e)
          totalErrors++
          errors.push({ mediaId: media.id, error: e.message })
        }
      }

      // Small delay between batches to avoid overwhelming the database
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Step 3: Verify migration results
    const { data: verificationData, error: verificationError } = await supabase
      .from('media_assets')
      .select('id, env, visibility')
      .eq('user_id', userId)
      .in('env', ['prod'])

    if (verificationError) {
      console.error('❌ Verification failed:', verificationError)
    }

    const result = {
      message: 'Migration completed',
      userId,
      totalMigrated,
      totalErrors,
      totalUserMedia: userMedia.length,
      prodMediaCount: verificationData?.length || 0,
      errors: errors.slice(0, 10), // Limit error details
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Migration completed for user ${userId}:`, result)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(result)
    }

  } catch (e) {
    console.error('❌ Migration function crashed:', e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: e?.message || 'Migration function crashed' }) 
    }
  }
}

