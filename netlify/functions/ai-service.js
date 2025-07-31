const fetch = require('node-fetch');

console.log('=== AI SERVICE DEBUG ===');
console.log('AI providers available:');
console.log('- OPENROUTER_API_KEY:', !!(process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY));
console.log('- HUGGINGFACE_API_KEY:', !!(process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY));
console.log('- DEEPINFRA_API_KEY:', !!(process.env.DEEPINFRA_API_KEY || process.env.VITE_DEEPINFRA_API_KEY));
console.log('- TOGETHER_API_KEY:', !!(process.env.TOGETHER_API_KEY || process.env.VITE_TOGETHER_API_KEY));
console.log('- REPLICATE_API_KEY:', !!(process.env.REPLICATE_API_KEY || process.env.VITE_REPLICATE_API_KEY));
console.log('- GROQ_API_KEY:', !!(process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY));
console.log('- AIMLAPI_API_KEY:', !!(process.env.AIMLAPI_API_KEY || process.env.VITE_AIMLAPI_API_KEY));

// AI Provider configurations
const AI_PROVIDERS = [
  {
    name: 'OpenRouter',
    apiKey: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://stefna.xyz',
      'X-Title': 'Stefna AI'
    }
  },
  {
    name: 'HuggingFace',
    apiKey: process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY,
    url: 'https://api-inference.huggingface.co/models/meta-llama/Llama-2-70b-chat-hf',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'DeepInfra',
    apiKey: process.env.DEEPINFRA_API_KEY || process.env.VITE_DEEPINFRA_API_KEY,
    url: 'https://api.deepinfra.com/v1/openai/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY || process.env.VITE_DEEPINFRA_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Together',
    apiKey: process.env.TOGETHER_API_KEY || process.env.VITE_TOGETHER_API_KEY,
    url: 'https://api.together.xyz/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.TOGETHER_API_KEY || process.env.VITE_TOGETHER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Groq',
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'AIMLAPI',
    apiKey: process.env.AIMLAPI_API_KEY || process.env.VITE_AIMLAPI_API_KEY,
    url: 'https://api.aimlapi.com/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.AIMLAPI_API_KEY || process.env.VITE_AIMLAPI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
].filter(provider => provider.apiKey); // Only include providers with API keys

console.log('Active AI providers:', AI_PROVIDERS.map(p => p.name));

// Generate prompts based on feature type
function generatePrompt(type, content, platform = 'general', style = 'viral') {
  const basePrompt = `You are Stefna AI, a professional content creation assistant. Create engaging, viral-worthy content that follows current trends and best practices.`;

  switch (type) {
    case 'caption':
      return `${basePrompt} Create a ${platform} caption for this content: "${content}". Make it engaging, use relevant hashtags, and follow ${platform} best practices.`;
    
    case 'tweet':
      return `${basePrompt} Create a ${style} tweet about: "${content}". Make it engaging and viral-worthy.`;
    
    case 'hashtags':
      return `${basePrompt} Generate 10 trending hashtags for this content: "${content}". Focus on ${platform} trends and make them relevant.`;
    
    case 'sentiment':
      return `${basePrompt} Analyze the sentiment and viral potential of this content: "${content}". Provide a detailed analysis with score (1-10) and recommendations.`;
    
    case 'title':
      return `${basePrompt} Create a viral title for this topic: "${content}". Make it click-worthy and engaging.`;
    
    case 'bio':
      return `${basePrompt} Create a professional bio for someone interested in: "${content}". Make it engaging and include relevant keywords.`;
    
    case 'rewrite':
      return `${basePrompt} Rewrite this content to be more viral and engaging: "${content}". Keep the core message but make it more shareable.`;
    
    default:
      return `${basePrompt} Help with: "${content}". Provide a helpful, engaging response.`;
  }
}

// Try AI providers in order until one works
async function tryAIProviders(prompt, type) {
  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`Trying ${provider.name}...`);
      
      let requestBody;
      
      if (provider.name === 'HuggingFace') {
        // HuggingFace uses a different format
        requestBody = {
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7
          }
        };
      } else {
        // Standard OpenAI format for other providers
        requestBody = {
          model: provider.name === 'OpenRouter' ? 'openai/gpt-4' : 
                 provider.name === 'Groq' ? 'llama3-8b-8192' : 
                 provider.name === 'AIMLAPI' ? 'gpt-4' : 'meta-llama/Llama-2-70b-chat-hf',
          messages: [
            {
              role: 'system',
              content: 'You are Stefna AI, a professional content creation assistant. Create engaging, viral-worthy content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        };
      }

      const response = await fetch(provider.url, {
        method: 'POST',
        headers: provider.headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.log(`${provider.name} failed:`, response.status);
        continue;
      }

      const data = await response.json();
      console.log(`${provider.name} succeeded!`);

      let result;
      if (provider.name === 'HuggingFace') {
        result = data[0]?.generated_text || data[0]?.text || 'No response generated';
      } else {
        result = data.choices?.[0]?.message?.content || 'No response generated';
      }

      return { success: true, result, provider: provider.name };
    } catch (error) {
      console.log(`${provider.name} error:`, error.message);
      continue;
    }
  }

  // Fallback to mock response if all providers fail
  console.log('All AI providers failed, using fallback response');
  return {
    success: true,
    result: `Here's a ${type} for you: ${content}. This is a fallback response as the AI services are currently unavailable.`,
    provider: 'fallback'
  };
}

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
    const body = JSON.parse(event.body);
    const { type, content, platform, style } = body;

    if (!type || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: type and content'
        })
      };
    }

    console.log(`AI request - Type: ${type}, Platform: ${platform}, Style: ${style}`);
    console.log(`Content: ${content.substring(0, 100)}...`);

    const prompt = generatePrompt(type, content, platform, style);
    const result = await tryAIProviders(prompt, type);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('AI service error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error while processing AI request'
      })
    };
  }
}; 