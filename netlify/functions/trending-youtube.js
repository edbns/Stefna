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

async function fetchYouTubeTrending() {
  const cacheKey = 'youtube_trending';
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('Returning cached YouTube data');
    return cached;
  }
  console.log('No cache hit - making fresh YouTube API call');
  const startTime = Date.now();

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    console.log('YouTube API Key check:', apiKey ? 'Present' : 'Missing');
    if (!apiKey) {
      console.error('YouTube API key not configured - returning empty array');
      return [];
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=20&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    const trends = data.items.map(item => ({
      id: item.id,
      platform: 'youtube',
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      creator: {
        name: item.snippet.channelTitle,
        username: item.snippet.channelTitle,
        avatar: null,
        verified: false,
        followers: 0
      },
      metrics: {
        views: parseInt(item.statistics.viewCount) || 0,
        likes: parseInt(item.statistics.likeCount) || 0,
        comments: parseInt(item.statistics.commentCount) || 0,
        shares: 0,
        engagementRate: 0
      },
      trendingScore: parseInt(item.statistics.viewCount) || 0,
      sentiment: 'neutral',
      category: item.snippet.categoryId,
      hashtags: [],
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      aiSummary: '',
      location: null
    }));

    const duration = Date.now() - startTime;
    console.log(`YouTube API call completed in ${duration}ms`);
    setCachedData(cacheKey, trends);
    return trends;
  } catch (error) {
    console.error('YouTube API error:', error);
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
    const data = await fetchYouTubeTrending();

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
        error: 'Failed to fetch YouTube trending data',
        details: error.message
      })
    };
  }
}; 