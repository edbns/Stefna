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

// AI Provider configurations
const AI_PROVIDERS = [
  {
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'anthropic/claude-3.5-sonnet',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://stefna.xyz',
      'X-Title': 'Stefna AI Chat'
    },
    transformRequest: (messages) => ({
      model: 'anthropic/claude-3.5-sonnet',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    }),
    transformResponse: (data) => data.choices?.[0]?.message?.content || 'No response'
  },
  {
    name: 'huggingface',
    apiKey: process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY,
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    model: 'microsoft/DialoGPT-medium',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    transformRequest: (messages) => ({
      inputs: messages[messages.length - 1].content,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        return_full_text: false
      }
    }),
    transformResponse: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        return data[0]?.generated_text || 'No response';
      }
      return data?.generated_text || 'No response';
    }
  },
  {
    name: 'deepinfra',
    apiKey: process.env.DEEPINFRA_API_KEY || process.env.VITE_DEEPINFRA_API_KEY,
    endpoint: 'https://api.deepinfra.com/v1/openai/chat/completions',
    model: 'meta-llama/Llama-2-70b-chat-hf',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY || process.env.VITE_DEEPINFRA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    transformRequest: (messages) => ({
      model: 'meta-llama/Llama-2-70b-chat-hf',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    }),
    transformResponse: (data) => data.choices?.[0]?.message?.content || 'No response'
  },
  {
    name: 'together',
    apiKey: process.env.TOGETHER_API_KEY || process.env.VITE_TOGETHER_API_KEY,
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    model: 'togethercomputer/llama-2-70b-chat',
    headers: {
      'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    transformRequest: (messages) => ({
      model: 'togethercomputer/llama-2-70b-chat',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    }),
    transformResponse: (data) => data.choices?.[0]?.message?.content || 'No response'
  },
  {
    name: 'groq',
    apiKey: process.env.GROQ_API_KEY,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama2-70b-4096',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    transformRequest: (messages) => ({
      model: 'llama2-70b-4096',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    }),
    transformResponse: (data) => data.choices?.[0]?.message?.content || 'No response'
  }
].filter(provider => provider.apiKey); // Only include providers with API keys

async function generateAIChatResponse(userMessage, conversationHistory = []) {
  const cacheKey = `chat_${userMessage.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

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

  // Try each AI provider in order
  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`Trying ${provider.name}...`);
      
      const requestBody = provider.transformRequest(messages);
      
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = provider.transformResponse(data);
      
      if (aiResponse && aiResponse !== 'No response') {
        console.log(`Success with ${provider.name}`);
        setCachedData(cacheKey, aiResponse);
        return aiResponse;
      }
    } catch (error) {
      console.error(`${provider.name} failed:`, error);
      // Continue to next provider
    }
  }

  // Fallback responses if all providers fail
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
    return 'Key metrics to track include engagement rate, reach, impressions, and click-through rate. Engagement rate above 3% is considered good. Would you like me to explain any specific metric?';
  }
  
  if (input.includes('hashtag') || input.includes('hashtags')) {
    return 'Effective hashtag strategy includes 3-5 relevant hashtags per post. Mix popular and niche hashtags. Research trending hashtags in your niche and use location-based tags when relevant.';
  }
  
  if (input.includes('time') || input.includes('when')) {
    return 'Best posting times vary by platform: Instagram (11 AM - 1 PM, 7-9 PM), Twitter (9 AM - 4 PM), TikTok (6-10 PM), LinkedIn (8-10 AM, 12-2 PM). Test your specific audience for optimal times.';
  }
  
  return 'I\'m here to help with social media analytics and trends! Ask me about content optimization, platform insights, or trending topics. What would you like to know?';
}

exports.handler = async (event) => {
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
    const { message, conversationHistory = [] } = JSON.parse(event.body || '{}');
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    const aiResponse = await generateAIChatResponse(message, conversationHistory);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('AI Chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate AI response',
        message: error.message 
      })
    };
  }
}; 