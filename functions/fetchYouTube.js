// Netlify function for YouTube API
import axios from 'axios';

export const handler = async (event, context) => {
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

  try {
    const { channelUrl } = JSON.parse(event.body || '{}');
    
    if (!channelUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Channel URL is required' })
      };
    }

    // Extract channel ID from URL
    const channelId = extractChannelId(channelUrl);
    
    if (!channelId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid YouTube channel URL' })
      };
    }

    // YouTube Data API v3 endpoint
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'YouTube API key not configured' })
      };
    }

    // Fetch channel statistics
    const channelResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
    );

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Channel not found' })
      };
    }

    const channel = channelResponse.data.items[0];
    const stats = channel.statistics;
    const snippet = channel.snippet;

    // Fetch recent videos
    const videosResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`
    );

    const videos = videosResponse.data.items || [];

    // Format response
    const response = {
      channel: {
        id: channelId,
        title: snippet.title,
        description: snippet.description,
        thumbnail: snippet.thumbnails?.high?.url,
        publishedAt: snippet.publishedAt
      },
      statistics: {
        subscribers: formatNumber(stats.subscriberCount),
        totalViews: formatNumber(stats.viewCount),
        videoCount: formatNumber(stats.videoCount),
        avgViews: calculateAvgViews(stats.viewCount, stats.videoCount)
      },
      videos: videos.map(video => ({
        id: video.id.videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails?.medium?.url,
        publishedAt: video.snippet.publishedAt
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('YouTube API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch YouTube data',
        details: error.message 
      })
    };
  }
};

// Helper functions
function extractChannelId(url) {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function formatNumber(num) {
  if (!num) return '0';
  
  const number = parseInt(num);
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  return number.toString();
}

function calculateAvgViews(totalViews, videoCount) {
  if (!totalViews || !videoCount || videoCount === '0') return '0';
  
  const avg = parseInt(totalViews) / parseInt(videoCount);
  return formatNumber(avg.toString());
}