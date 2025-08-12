// netlify/functions/getPublicFeed.ts
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event) => {
  try {
    const limitRaw = event.queryStringParameters?.limit ?? '20'
    const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 50)

    const SUPABASE_URL = process.env.SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('getPublicFeed: Missing Supabase env')
      return { statusCode: 200, body: JSON.stringify({ items: [] }) }
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })

    // Use the media_feed view which includes user avatar and tier information
    const { data, error } = await sb
      .from('media_feed')
      .select('id,url,created_at,visibility,env,user_id,metadata,prompt,user_avatar,user_tier') // <-- includes user data
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('getPublicFeed supabase error:', error)
      return { statusCode: 200, body: JSON.stringify({ items: [] }) }
    }

    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      url: row.url,
      created_at: row.created_at,
      visibility: row.visibility,
      env: row.env,
      user_id: row.user_id,
      prompt: row.prompt || null, // Include the actual prompt
      user_avatar: row.user_avatar || null, // Include user avatar
      user_tier: row.user_tier || null, // Include user tier
      // Derive a thumbnail if you have it in JSON; otherwise null.
      thumbnail_url:
        row.thumbnail_url ??
        row.metadata?.thumbnail_url ??
        row.metadata?.thumb ??
        null,
      // Don't rely on a DB column that may not exist; compute later if needed.
      likes_count: 0,
    }))

    return { statusCode: 200, body: JSON.stringify({ items }) }
  } catch (err) {
    console.error('getPublicFeed fatal:', err)
    // Return a valid response so Netlify doesn't 502 with status code 0
    return { statusCode: 200, body: JSON.stringify({ items: [] }) }
  }
}
