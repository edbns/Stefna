const fetch = require('node-fetch');

// Cache for API responses (in-memory for serverless)
const cache = new Map();
const CACHE_TTL = 20 * 60 * 1000; // 20 minutes

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function fetchRedditTrending() {
  const cacheKey = 'reddit_trending';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      'https://www.reddit.com/r/popular.json?limit=20',
      {
        headers: {
          'User-Agent': 'Stefna/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    
    const trends = data.data.children.map(post => ({
      id: post.data.id,
      platform: 'reddit',
      title: post.data.title,
      description: post.data.selftext || '',
      thumbnail: post.data.thumbnail !== 'self' ? post.data.thumbnail : null,
      creator: {
        name: post.data.author,
        username: post.data.author,
        avatar: null,
        verified: false,
        followers: 0
      },
      metrics: {
        views: 0,
        likes: post.data.score,
        comments: post.data.num_comments,
        shares: 0,
        engagementRate: 0
      },
      trendingScore: post.data.score,
      sentiment: 'neutral',
      category: post.data.subreddit,
      hashtags: [],
      publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
      url: `https://reddit.com${post.data.permalink}`,
      aiSummary: '',
      location: null
    }));

    setCachedData(cacheKey, trends);
    return trends;
  } catch (error) {
    console.error('Reddit API error:', error);
    return [];
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const data = await fetchRedditTrending();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch Reddit trending data',
        details: error.message
      })
    };
  }
}; 