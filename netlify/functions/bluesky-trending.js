const { BskyAgent } = require('@atproto/api');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get environment variables
    const username = process.env.BLUESKY_USERNAME;
    const password = process.env.BLUESKY_PASSWORD;

    if (!username || !password) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Bluesky credentials not configured. Please set BLUESKY_USERNAME and BLUESKY_PASSWORD in Netlify environment variables.',
        }),
      };
    }

    // Parse query parameters
    const { limit = 20, hashtag = null } = event.queryStringParameters || {};

    // Create Bluesky agent
    const agent = new BskyAgent({
      service: 'https://bsky.social',
    });

    // Authenticate with Bluesky
    await agent.login({
      identifier: username,
      password: password,
    });

    let posts = [];

    if (hashtag) {
      // Fetch posts by hashtag
      const response = await agent.api.app.bsky.feed.searchPosts({
        q: `#${hashtag}`,
        limit: parseInt(limit),
      });
      posts = response.data.posts;
    } else {
      // Fetch global timeline
      const response = await agent.api.app.bsky.feed.getTimeline({
        algorithm: 'reverse-chronological',
        limit: parseInt(limit),
      });
      posts = response.data.feed;
    }

    // Transform posts to a consistent format
    const transformedPosts = posts.map((post, index) => {
      const author = post.author || post.post?.author;
      const record = post.record || post.post?.record;
      const embed = post.embed || post.post?.embed;
      
      // Extract images from embed
      let images = [];
      if (embed?.images) {
        images = embed.images.map(img => ({
          url: img.fullsize,
          alt: img.alt || 'Bluesky image',
        }));
      }

      // Extract hashtags from text
      const hashtags = [];
      if (record?.text) {
        const hashtagRegex = /#(\w+)/g;
        const matches = record.text.match(hashtagRegex);
        if (matches) {
          hashtags.push(...matches.map(tag => tag.substring(1)));
        }
      }

      return {
        id: post.uri || post.post?.uri || `bluesky-${index}`,
        platform: 'bluesky',
        title: record?.text?.substring(0, 100) + (record?.text?.length > 100 ? '...' : ''),
        description: record?.text || '',
        author: {
          name: author?.displayName || author?.handle || 'Unknown',
          username: author?.handle || 'unknown',
          avatar: author?.avatar || null,
          verified: author?.labels?.some(label => label.val === 'verified') || false,
        },
        engagement: {
          likes: post.likeCount || 0,
          reposts: post.repostCount || 0,
          replies: post.replyCount || 0,
          views: post.viewCount || 0,
        },
        media: images.length > 0 ? {
          type: 'image',
          url: images[0].url,
          alt: images[0].alt,
        } : null,
        hashtags,
        timestamp: record?.createdAt || new Date().toISOString(),
        url: `https://bsky.app/profile/${author?.handle}/post/${post.uri?.split('/').pop()}`,
        trendingScore: Math.floor(Math.random() * 100) + 1, // Placeholder score
        sentiment: 'neutral', // Placeholder sentiment
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        posts: transformedPosts,
        count: transformedPosts.length,
        platform: 'bluesky',
        hashtag: hashtag || null,
      }),
    };

  } catch (error) {
    console.error('Bluesky API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch Bluesky trending posts',
        details: error.message,
      }),
    };
  }
}; 