const { createClient } = require('@supabase/supabase-js')
const { v2: cloudinary } = require('cloudinary')
const { verifyAuth } = require('./_auth')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

    const { userId } = verifyAuth(event)
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
    if (!isUuid(userId)) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }

    const body = JSON.parse(event.body || '{}')
    const { id } = body
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) }

    // NO_DB_MODE: Delete directly from Cloudinary using public_id
    if (process.env.NO_DB_MODE === 'true') {
      try {
        console.log(`[delete-media] NO_DB_MODE: Deleting Cloudinary asset: ${id}`)
        
        // In NO_DB_MODE, the 'id' is actually the Cloudinary public_id
        // Try both image and video resource types since we don't know which one it is
        let deleteSuccess = false
        
        // Try image first
        try {
          await cloudinary.uploader.destroy(id, {
            resource_type: 'image',
            invalidate: true,
          })
          deleteSuccess = true
          console.log(`[delete-media] Successfully deleted image: ${id}`)
        } catch (imageErr) {
          console.log(`[delete-media] Not an image, trying video: ${id}`)
          
          // Try video if image failed
          try {
            await cloudinary.uploader.destroy(id, {
              resource_type: 'video',
              invalidate: true,
            })
            deleteSuccess = true
            console.log(`[delete-media] Successfully deleted video: ${id}`)
          } catch (videoErr) {
            console.warn(`[delete-media] Failed to delete as both image and video: ${id}`, videoErr?.message)
          }
        }

        if (deleteSuccess) {
          return { statusCode: 200, body: JSON.stringify({ ok: true }) }
        } else {
          return { statusCode: 404, body: JSON.stringify({ error: 'Asset not found in Cloudinary' }) }
        }
      } catch (e) {
        console.error('[delete-media] NO_DB_MODE error:', e)
        return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary deletion failed' }) }
      }
    }

    // DB_MODE: Original Supabase + Cloudinary logic
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Fetch media row to verify ownership and get public_id if present
    const { data: media, error: fetchErr } = await supabase
      .from('media_assets')
      .select('id, user_id, public_id, resource_type')
      .eq('id', id)
      .single()

    if (fetchErr || !media) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) }
    if (media.user_id !== userId) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }

    // Best-effort Cloudinary delete if we have public_id
    try {
      if (media.public_id && process.env.CLOUDINARY_CLOUD_NAME) {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: media.resource_type === 'video' ? 'video' : 'image',
          invalidate: true,
        })
      }
    } catch (ce) {
      console.warn('Cloudinary delete failed (continuing):', ce?.message || ce)
    }

    // Delete DB row
    const { error: delErr } = await supabase.from('media_assets').delete().eq('id', id)
    if (delErr) return { statusCode: 400, body: JSON.stringify({ error: delErr.message }) }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (e) {
    console.error('delete-media error:', e)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}


