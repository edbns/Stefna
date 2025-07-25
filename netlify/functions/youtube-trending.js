const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { region = 'US', maxResults = 25 } = event.queryStringParameters || {};
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'YouTube API key not configured' }),
      };
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        regionCode: region,
        maxResults: parseInt(maxResults),
        key: YOUTUBE_API_KEY,
      },
    });

    const videos = response.data.items.map(video => ({
      id: video.id,
      platform: 'youtube',
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount || 0),
      likeCount: parseInt(video.statistics.likeCount || 0),
      duration: video.contentDetails.duration,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      tags: video.snippet.tags || [],
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: videos }),
    };
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch YouTube trending videos',
        details: error.response?.data?.error?.message || error.message 
      }),
    };
  }
};