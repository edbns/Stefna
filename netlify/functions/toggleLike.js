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

    const { mediaId } = JSON.parse(event.body);
    
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

    // Check if user already liked this media
    const { data: existingLike, error: checkError } = await supabase
      .from('media_likes')
      .select('id')
      .eq('media_id', mediaId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing like:', checkError);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Failed to check existing like' }) 
      };
    }

    let action, newCount;
    
    if (existingLike) {
      // Unlike: remove the like
      const { error: deleteError } = await supabase
        .from('media_likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ error: 'Failed to remove like' }) 
        };
      }
      
      action = 'unliked';
    } else {
      // Like: add the like
      const { error: insertError } = await supabase
        .from('media_likes')
        .insert({
          media_id: mediaId,
          user_id: userId
        });
      
      if (insertError) {
        console.error('Error adding like:', insertError);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ error: 'Failed to add like' }) 
        };
      }
      
      action = 'liked';
    }

    // Get updated like count
    const { count: likeCount, error: countError } = await supabase
      .from('media_likes')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId);

    if (countError) {
      console.error('Error getting like count:', countError);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Failed to get like count' }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        action,
        likeCount: likeCount || 0,
        isLiked: action === 'liked'
      }) 
    };
  } catch (error) {
    console.error('Toggle like error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
