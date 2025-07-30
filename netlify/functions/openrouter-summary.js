const fetch = require('node-fetch');

// Cache for API responses (in-memory for serverless)
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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

async function generateAISummary(content) {
  const cacheKey = `summary_${content.id}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = `Analyze this trending content and provide a brief, engaging summary (max 100 words):

Title: ${content.title}
Description: ${content.description}
Platform: ${content.platform}
Creator: ${content.creator.name}
Metrics: ${content.metrics.likes} likes, ${content.metrics.comments} comments
Category: ${content.category}

Focus on why this content is trending and what makes it engaging.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://socialspy.netlify.app',
        'X-Title': 'SocialSpy AI Summarizer'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || 'AI summary unavailable';
    
    setCachedData(cacheKey, summary);
    return summary;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return 'AI summary unavailable';
  }
}

async function generateSummariesForContent(contentArray) {
  try {
    const summaries = await Promise.all(
      contentArray.map(async (content) => {
        const summary = await generateAISummary(content);
        return {
          id: content.id,
          aiSummary: summary
        };
      })
    );
    return summaries;
  } catch (error) {
    console.error('Error generating summaries:', error);
    return contentArray.map(content => ({
      id: content.id,
      aiSummary: 'AI summary unavailable'
    }));
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
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const contentArray = body.content || [];
      
      if (contentArray.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'No content provided'
          })
        };
      }

      const summaries = await generateSummariesForContent(contentArray);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: summaries,
          timestamp: new Date().toISOString()
        })
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST with content array.'
        })
      };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate AI summaries',
        details: error.message
      })
    };
  }
}; 