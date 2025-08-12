// getPublicFeed.ts - TypeScript version using media_feed view
import { createClient } from '@supabase/supabase-js';

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const limit = Math.max(1, Math.min(50, Number(new URL(event.rawUrl).searchParams.get('limit') || 20)));
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const ENV = process.env.PUBLIC_APP_ENV || 'prod';
    console.log(`🌍 Feed query: env=${ENV}, limit=${limit}`);

    // Use the media_feed view instead of media_assets table directly
    // This view provides computed likes_count and remixes_count
    const { data, error } = await supabase
      .from('media_feed')            // <- use the view, not media_assets
      .select('*')
      .eq('env', ENV)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getPublicFeed] supabase error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    console.log(`✅ Feed returned: ${data?.length || 0} items`);
    
    return { 
      statusCode: 200, 
      body: JSON.stringify(data) 
    };
  } catch (e: any) {
    console.error('[getPublicFeed] fatal:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'internal error' }) };
  }
};
