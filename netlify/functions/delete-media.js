const { neon } = require('@neondatabase/serverless')
const { v2: cloudinary } = require('cloudinary')
const { requireJWTUser, resp, handleCORS } = require('./_auth')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

exports.handler = async (event) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'Method Not Allowed' })

    // Auth check using JWT
    const user = requireJWTUser(event)
    if (!user) return resp(401, { error: 'Unauthorized - Invalid or missing JWT token' })

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
          return resp(200, { ok: true })
        } else {
          return resp(404, { error: 'Asset not found in Cloudinary' })
        }
      } catch (e) {
        console.error('[delete-media] NO_DB_MODE error:', e)
        return resp(500, { error: 'Cloudinary deletion failed' })
      }
    }

    // DB_MODE: Neon + Cloudinary logic
    const sql = neon(process.env.NETLIFY_DATABASE_URL)

    // Fetch media row to verify ownership and get public_id if present
    let media;
    try {
      const mediaResult = await sql`
        SELECT id, owner_id, public_id, resource_type
        FROM media_assets 
        WHERE id = ${id}
      `
      if (!mediaResult || mediaResult.length === 0) {
        return resp(404, { error: 'Not found' })
      }
      media = mediaResult[0]
    } catch (fetchErr) {
      return resp(404, { error: 'Not found' })
    }

    if (media.owner_id !== user.userId) return resp(403, { error: 'Forbidden' })

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
    try {
      await sql`DELETE FROM media_assets WHERE id = ${id}`
    } catch (delErr) {
      return resp(400, { error: delErr.message || 'Database deletion failed' })
    }

    return resp(200, { ok: true })
  } catch (e) {
    console.error('delete-media error:', e)
    return resp(500, { error: 'Internal server error' })
  }
}


