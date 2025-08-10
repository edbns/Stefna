const { verifyAuth } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Optional: verify auth for user-specific features (like "liked by me")
    let userId = null;
    try {
      const auth = verifyAuth(event);
      userId = auth.userId;
    } catch (e) {
      // Guest users can still view public feed
      console.log('Guest user viewing public feed');
    }
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get public media feed with interaction counts
    const { data: publicMedia, error } = await supabase
      .from('public_media_with_counts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get public feed error:', error);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: error.message }) 
      };
    }

    // Transform data to include user info and interaction counts
    const transformedMedia = (publicMedia || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      user_name: item.user_name || 'Anonymous',
      result_url: item.result_url,
      source_url: item.source_url,
      mode: item.mode,
      prompt: item.prompt,
      negative_prompt: item.negative_prompt,
      width: item.width,
      height: item.height,
      strength: item.strength,
      allow_remix: item.allow_remix,
      parent_asset_id: item.parent_asset_id,
      created_at: item.created_at,
      likes_count: item.likes_count || 0,
      remixes_count: item.remixes_count || 0,
      shares_count: item.shares_count || 0
    }));

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        media: transformedMedia,
        total: transformedMedia.length
      }) 
    };
  } catch (error) {
    console.error('getPublicFeed error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
