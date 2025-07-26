// Netlify function for YouTube API (search-based, with stats)
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const query = event.queryStringParameters?.query || 'indonesia';
  const pageToken = event.queryStringParameters?.pageToken || '';
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing YOUTUBE_API_KEY in environment' })
    };
  }

  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Get video IDs from search results
    const videoIds = (data.items || [])
      .map(item => item.id && (item.id.videoId || item.id))
      .filter(Boolean)
      .join(',');

    let statsMap = {};
    if (videoIds) {
      // Fetch video statistics for all IDs
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
      const statsRes = await fetch(statsUrl);
      const statsData = await statsRes.json();
      (statsData.items || []).forEach(item => {
        statsMap[item.id] = item.statistics;
      });
    }

    // Merge stats into each video item
    data.items = (data.items || []).map(item => {
      const vid = item.id && (item.id.videoId || item.id);
      const stats = statsMap[vid] || {};
      return {
        ...item,
        statistics: {
          viewCount: stats.viewCount || 0,
          likeCount: stats.likeCount || 0,
          commentCount: stats.commentCount || 0
        }
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('YouTube API fetch error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};