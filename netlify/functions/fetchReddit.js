const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    // Get Reddit credentials from environment variables
    const clientId = process.env.VITE_REDDIT_CLIENT_ID;
    const clientSecret = process.env.VITE_REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Reddit API credentials not configured',
          message: 'Please set VITE_REDDIT_CLIENT_ID and VITE_REDDIT_CLIENT_SECRET in Netlify environment variables'
        })
      };
    }

    // Step 1: Get access token using client credentials
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Stefna/1.0 (by /u/stefna_xyz)'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Fetch trending posts from r/popular
    const postsResponse = await fetch('https://oauth.reddit.com/r/popular/top?limit=10&t=day', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Stefna/1.0 (by /u/stefna_xyz)'
      }
    });

    if (!postsResponse.ok) {
      throw new Error(`Posts request failed: ${postsResponse.status}`);
    }

    const postsData = await postsResponse.json();
    
    // Step 3: Transform the data to match our frontend expectations
    const simplifiedPosts = postsData.data.children.map(post => {
      const postData = post.data;
      return {
        id: postData.id,
        title: postData.title,
        subreddit: postData.subreddit,
        thumbnail: postData.thumbnail !== 'self' && postData.thumbnail !== 'default' 
          ? postData.thumbnail 
          : null,
        upvotes: postData.ups,
        url: `https://reddit.com${postData.permalink}`,
        author: postData.author,
        created: postData.created_utc,
        numComments: postData.num_comments,
        isVideo: postData.is_video,
        isSelf: postData.is_self,
        domain: postData.domain
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        posts: simplifiedPosts,
        count: simplifiedPosts.length
      })
    };

  } catch (error) {
    console.error('Reddit API error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        error: 'Failed to fetch Reddit posts',
        message: error.message
      })
    };
  }
}; 