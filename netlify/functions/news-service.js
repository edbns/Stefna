const fetch = require('node-fetch');

console.log('=== NEWS SERVICE DEBUG ===');
console.log('NEWSDATA_API_KEY exists:', !!process.env.NEWSDATA_API_KEY || !!process.env.VITE_NEWSDATA_API_KEY);
console.log('NEWSDATA_API_KEY length:', (process.env.NEWSDATA_API_KEY || process.env.VITE_NEWSDATA_API_KEY) ? (process.env.NEWSDATA_API_KEY || process.env.VITE_NEWSDATA_API_KEY).length : 0);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
    const apiKey = process.env.NEWSDATA_API_KEY || process.env.VITE_NEWSDATA_API_KEY;
    
    if (!apiKey) {
      console.error('NEWSDATA_API_KEY not found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'NewsData API key not configured. Please set NEWSDATA_API_KEY in Netlify environment variables.'
        })
      };
    }

    // Parse query parameters
    const { limit = 10, category = 'top' } = event.queryStringParameters || {};

    // Build API URL
    const params = new URLSearchParams({
      apikey: apiKey,
      country: 'us',
      language: 'en',
      category: category,
      size: limit.toString()
    });

    const url = `https://newsdata.io/api/1/news?${params.toString()}`;
    console.log('Calling NewsData API:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('NewsData API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `NewsData API failed: ${response.status} - ${response.statusText}`
        })
      };
    }

    const data = await response.json();
    console.log('NewsData response received:', data.status, data.results?.length || 0, 'articles');

    if (data.status !== 'success') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `NewsData API returned error status: ${data.status}`
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data.results || [],
        totalResults: data.totalResults,
        nextPage: data.nextPage
      })
    };

  } catch (error) {
    console.error('News service error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error while fetching news'
      })
    };
  }
}; 