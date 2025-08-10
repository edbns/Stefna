const { verifyAuth } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = verifyAuth(event);
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user's all media with interaction counts
    const { data: media, error } = await supabase
      .from('user_media_with_counts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user media error:', error);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: error.message }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ media: media || [] }) 
    };
  } catch (error) {
    console.error('getUserMedia error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
