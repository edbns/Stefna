// netlify/functions/getPublicFeed.ts
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  try {
    const limitRaw = event.queryStringParameters?.limit ?? '20'
    const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 50)

    const SUPABASE_URL = process.env.SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLOUDINARY_CLOUD_NAME) {
      console.error('getPublicFeed: Missing required env vars:', {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
        hasCloudinaryName: !!CLOUDINARY_CLOUD_NAME
      })
      return { statusCode: 200, body: JSON.stringify({ items: [] }) }
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })

    // Use the new unified public_feed view
    console.log('🔍 Querying public_feed view...')
    
    // First, let's see what's in the public_feed view
    const { data: allData, error: allError } = await sb
      .from('public_feed')
      .select('id,cloudinary_public_id,media_type,published_at,source_asset_id,preset_key,prompt')
      .limit(10)
    
    if (allError) {
      console.error('❌ Error querying public_feed view:', allError)
      console.log('🔄 Falling back to direct assets query...')
      
      // Fallback: query assets table directly
      const { data: fallbackData, error: fallbackError } = await sb
        .from('assets')
        .select('id,cloudinary_public_id,media_type,published_at,source_asset_id,preset_key,prompt')
        .eq('is_public', true)
        .eq('status', 'ready')
        .not('published_at', 'is', null)
        .not('cloudinary_public_id', 'is', null)
        .not('media_type', 'is', null)
        .order('published_at', { ascending: false })
        .limit(limit)
      
      if (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError)
        return { statusCode: 200, body: JSON.stringify({ items: [] }) }
      }
      
      console.log('✅ Fallback query successful, items found:', fallbackData?.length || 0)
      return { statusCode: 200, body: JSON.stringify({ items: fallbackData || [] }) }
    }
    
    console.log('📊 Public feed items found:', allData?.length || 0)
    
    // Query the public_feed view for the requested limit
    const { data, error } = await sb
      .from('public_feed')
      .select('id,cloudinary_public_id,media_type,published_at,source_asset_id,preset_key,prompt')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ getPublicFeed supabase error:', error)
      return { statusCode: 200, body: JSON.stringify({ items: [] }) }
    }
    
    console.log('✅ Public media items found:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('🔍 First public item:', {
        id: data[0].id,
        visibility: data[0].visibility,
        hasUrl: !!data[0].url,
        env: data[0].env
      })
    }

    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      cloudinary_public_id: row.cloudinary_public_id,
      media_type: row.media_type,
      published_at: row.published_at,
      source_asset_id: row.source_asset_id,
      preset_key: row.preset_key,
      prompt: row.prompt || null,
      // Construct Cloudinary URL
      url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${row.media_type}/upload/${row.cloudinary_public_id}`,
      // Additional fields for compatibility
      created_at: row.published_at, // Use published_at as created_at for feed ordering
      visibility: 'public',
      env: 'production',
      user_id: null, // Will be added later if needed
      user_avatar: null,
      user_tier: null,
      thumbnail_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${row.media_type}/upload/${row.cloudinary_public_id}`,
      likes_count: 0,
    }))

    return { statusCode: 200, body: JSON.stringify({ items }) }
  } catch (err) {
    console.error('getPublicFeed fatal:', err)
    // Return a valid response so Netlify doesn't 502 with status code 0
    return { statusCode: 200, body: JSON.stringify({ items: [] }) }
  }
}
