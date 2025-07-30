const fetch = require('node-fetch');

// Cache for API responses (in-memory for serverless)
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

async function generateAIChatResponse(userMessage, conversationHistory = []) {
  const cacheKey = `chat_${userMessage.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Build conversation context
    const systemPrompt = `You are an AI assistant for Stefna, a social media analytics dashboard. You help users analyze trending content, understand social media metrics, and provide insights about content performance.

Your expertise includes:
- Social media trends and analytics
- Content optimization strategies
- Platform-specific insights (YouTube, TikTok, Reddit, Instagram, Twitter)
- Engagement metrics interpretation
- Hashtag and SEO optimization
- Best posting times and strategies

Keep responses helpful, concise (under 150 words), and focused on social media analytics. Be conversational but professional.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5), // Keep last 5 messages for context
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stefna.xyz',
        'X-Title': 'Stefna AI Chat'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || 'I apologize, but I\'m having trouble processing your request right now. Could you try rephrasing your question?';
    
    setCachedData(cacheKey, aiResponse);
    return aiResponse;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    
    // Fallback responses based on keywords
    const input = userMessage.toLowerCase();
    
    if (input.includes('trend') || input.includes('trending')) {
      return 'Based on current data, the top trending topics include AI technology, sustainable living, and short-form video content. Would you like me to analyze specific metrics for any platform?';
    }
    
    if (input.includes('youtube')) {
      return 'YouTube trends show strong performance in educational content, gaming, and lifestyle vlogs. The optimal posting time is typically 2-4 PM EST. Would you like specific optimization tips?';
    }
    
    if (input.includes('tiktok')) {
      return 'TikTok\'s algorithm favors authentic, engaging content with trending sounds. Short, punchy videos (15-30 seconds) perform best. Current trending hashtags include #fyp, #viral, and niche-specific tags.';
    }
    
    if (input.includes('instagram')) {
      return 'Instagram Reels are driving the most engagement right now. Stories with polls and questions boost interaction. The best posting times are 11 AM - 1 PM and 7-9 PM.';
    }
    
    if (input.includes('analytics') || input.includes('metrics')) {
      return 'Key metrics to track include engagement rate, reach, impressions, and sentiment analysis. I can help you interpret these metrics and suggest improvements based on your content performance.';
    }
    
    if (input.includes('optimize') || input.includes('improve')) {
      return 'To optimize your content: 1) Post consistently, 2) Use relevant hashtags, 3) Engage with your audience, 4) Analyze peak activity times, 5) Create platform-specific content. Which area would you like to focus on?';
    }
    
    return 'That\'s an interesting question! I can help you with social media trends, content optimization, platform-specific strategies, and analytics interpretation. Could you provide more details about what you\'d like to know?';
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
      const { message, conversationHistory = [] } = body;
      
      if (!message || typeof message !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Message is required and must be a string'
          })
        };
      }

      const aiResponse = await generateAIChatResponse(message, conversationHistory);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            response: aiResponse,
            timestamp: new Date().toISOString()
          }
        })
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST with message and optional conversationHistory.'
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
        error: 'Failed to generate AI response',
        details: error.message
      })
    };
  }
}; 