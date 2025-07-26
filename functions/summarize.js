// Netlify function for AI summarization using OpenRouter with multiple models
const axios = require('axios');

// Cache for rate limiting
const requestCache = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 1;

exports.handler = async (event, context) => {
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
    const { text, maxLength = 200 } = JSON.parse(event.body || '{}');
    
    if (!text) {
      console.log('No text provided for summarization');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text content is required' })
      };
    }

    console.log('Summarization request received:', { textLength: text.length, maxLength });
  
    // Use OpenRouter API for summarization (if configured)
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    console.log('API Keys available:', { 
      openRouter: !!openRouterKey, 
      openai: !!openaiKey 
    });
    
    if (openRouterKey) {
      console.log('Attempting OpenRouter summary...');
      return await generateOpenRouterSummary(text, maxLength, openRouterKey, headers);
    } else if (openaiKey) {
      console.log('Attempting OpenAI summary...');
      return await generateOpenAISummary(text, maxLength, openaiKey, headers);
    } else {
      console.log('No API keys available, using simple summary...');
      // Fallback to simple summary
      return await generateSimpleSummary(text, maxLength, headers);
    }

  } catch (error) {
    console.error('Summarization Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate summary',
        details: error.message 
      })
    };
  }
};

async function generateOpenRouterSummary(text, maxLength, apiKey, headers) {
  try {
    // Check rate limiting
    const now = Date.now();
    const cacheKey = 'openrouter_requests';
    const requests = requestCache.get(cacheKey) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      console.log('Rate limit reached, using simple summary...');
      return await generateSimpleSummary(text, maxLength, headers);
    }
    
    // Add current request to cache
    recentRequests.push(now);
    requestCache.set(cacheKey, recentRequests);
    
    console.log('Making OpenRouter API call...');
    
    // Array of free models to rotate through
    const freeModels = [
      'deepseek/deepseek-r1-0528:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'anthropic/claude-3-haiku:free',
      'google/gemini-flash-1.5:free',
      'mistralai/mistral-7b-instruct:free'
    ];
    
    // Select a random model to distribute load
    const selectedModel = freeModels[Math.floor(Math.random() * freeModels.length)];
    console.log('Using model:', selectedModel);
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides concise, insightful summaries for a social media analytics dashboard.'
          },
          {
            role: 'user',
            content: `Please provide a brief summary of this content (max ${maxLength} characters):\n\n${text}`
          }
        ],
        max_tokens: Math.floor(maxLength / 4),
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://your-site.netlify.app',
          'X-Title': 'SpyDash Analytics'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('OpenRouter API response received');
    const summary = response.data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary,
        method: 'openrouter',
        model: selectedModel,
        confidence: 'high'
      })
    };

  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    
    // If it's a rate limit error, use simple summary
    if (error.response?.status === 429) {
      console.log('Rate limit exceeded, falling back to simple summary');
      return await generateSimpleSummary(text, maxLength, headers);
    }
    
    // For other errors, also fallback to simple summary
    console.log('Falling back to simple summary due to OpenRouter error');
    return await generateSimpleSummary(text, maxLength, headers);
  }
}

async function generateOpenAISummary(text, maxLength, apiKey, headers) {
  try {
    console.log('Making OpenAI API call...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides concise, insightful summaries.'
          },
          {
            role: 'user',
            content: `Please provide a summary of this text (max ${maxLength} characters):\n\n${text}`
          }
        ],
        max_tokens: Math.floor(maxLength / 4),
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('OpenAI API response received');
    const summary = response.data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary,
        method: 'openai',
        confidence: 'high'
      })
    };

  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    
    // Fallback to simple summary
    console.log('Falling back to simple summary due to OpenAI error');
    return await generateSimpleSummary(text, maxLength, headers);
  }
}

async function generateSimpleSummary(text, maxLength, headers) {
  console.log('Generating simple summary...');
  
  // Simple summary generation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let summary = sentences.slice(0, 2).join('. ') + '.';
  
  // Truncate if too long
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength - 3) + '...';
  }

  console.log('Simple summary generated:', summary);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      summary,
      method: 'simple',
      confidence: 'medium'
    })
  };
}