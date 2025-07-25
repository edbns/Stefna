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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { title, description, platform } = JSON.parse(event.body);
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenRouter API key not configured' }),
      };
    }

    const prompt = `Analyze this ${platform} content and provide a brief, engaging summary in 2-3 sentences:

Title: ${title}
Description: ${description?.substring(0, 500) || 'No description available'}

Focus on:
- Main topic/theme
- Why it's trending
- Key insights or takeaways

Keep it concise and engaging for social media users.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-3.5-turbo', // Free tier model
      messages: [
        {
          role: 'system',
          content: 'You are a social media analyst who creates engaging, concise summaries of trending content. Focus on why content is viral and what makes it interesting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.URL || 'http://localhost:3000',
        'X-Title': 'SpyDash Social Media Tracker',
      },
    });

    const summary = response.data.choices[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        summary: summary || 'Unable to generate summary at this time.',
        model: 'gpt-3.5-turbo'
      }),
    };
  } catch (error) {
    console.error('OpenRouter AI Error:', error.response?.data || error.message);
    
    // Fallback to a simple summary if AI fails
    const { title } = JSON.parse(event.body);
    const fallbackSummary = `Trending content: ${title}. This ${JSON.parse(event.body).platform} post is gaining popularity and engagement across social media platforms.`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        summary: fallbackSummary,
        model: 'fallback',
        note: 'AI service unavailable, using fallback summary'
      }),
    };
  }
};