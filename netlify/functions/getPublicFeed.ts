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

    // Use service role to bypass RLS and query media_assets directly
    const { data, error } = await sb
      .from('media_assets')
      .select('id,result_url as url,created_at,visibility,env,user_id,metadata,prompt')
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
      prompt: row.prompt || null,
      // Simple fallback for now - we can add user data back later
      user_avatar: null,
      user_tier: null,
      thumbnail_url: row.url, // Use main URL as thumbnail for now
      likes_count: 0,
    }))

    return { statusCode: 200, body: JSON.stringify({ items }) }
  } catch (err) {
    console.error('getPublicFeed fatal:', err)
    // Return a valid response so Netlify doesn't 502 with status code 0
    return { statusCode: 200, body: JSON.stringify({ items: [] }) }
  }
}
