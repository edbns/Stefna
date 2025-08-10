const { verifyAuth } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = verifyAuth(event);
    
    if (!userId) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Authentication required' }) 
      };
    }

    const { mediaId, shareType = 'public' } = JSON.parse(event.body);
    
    if (!mediaId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Media ID is required' }) 
      };
    }

    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if user already shared this media with this type
    const { data: existingShare, error: checkError } = await supabase
      .from('media_shares')
      .select('id')
      .eq('media_id', mediaId)
      .eq('user_id', userId)
      .eq('share_type', shareType)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing share:', checkError);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Failed to check existing share' }) 
      };
    }

    let action;
    
    if (existingShare) {
      // User already shared this media with this type
      action = 'already_shared';
    } else {
      // Record the share
      const { error: insertError } = await supabase
        .from('media_shares')
        .insert({
          media_id: mediaId,
          user_id: userId,
          share_type: shareType
        });
      
      if (insertError) {
        console.error('Error recording share:', insertError);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ error: 'Failed to record share' }) 
        };
      }
      
      action = 'shared';
    }

    // Get updated share count
    const { count: shareCount, error: countError } = await supabase
      .from('media_shares')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId);

    if (countError) {
      console.error('Error getting share count:', countError);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Failed to get share count' }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        action,
        shareCount: shareCount || 0
      }) 
    };
  } catch (error) {
    console.error('Record share error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
