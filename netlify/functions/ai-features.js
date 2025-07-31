const AIMLAPI = require('aimlapi');

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
    // Parse request body
    const body = JSON.parse(event.body);
    const { type, content, platform, style, context } = body;

    // Validate required fields
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

    // Initialize AIMLAPI
    const aimlapi = new AIMLAPI(process.env.AIMLAPI_API_KEY);

    // Generate prompt based on feature type
    let prompt = '';
    let model = 'gpt-4'; // Default model

    switch (type) {
      case 'caption':
        prompt = `Generate a viral ${platform || 'instagram'} caption for this content: "${content}". 
        Make it engaging, use relevant hashtags, and include a call-to-action. 
        Keep it under 220 characters for ${platform || 'instagram'}.`;
        break;
      
      case 'tweet':
        prompt = `Generate a ${style || 'viral'} tweet about: "${content}". 
        Make it engaging, include relevant hashtags, and keep it under 280 characters. 
        Make it shareable and viral-worthy.`;
        break;
      
      case 'reddit':
        prompt = `Generate a Reddit post for r/${platform || 'general'} about: "${content}". 
        Make it engaging, include a title and body text. 
        Follow Reddit's style and community guidelines.`;
        break;
      
      case 'title':
        prompt = `Generate a catchy ${platform || 'youtube'} video title about: "${content}". 
        Make it clickbait-worthy but not misleading. 
        Include relevant keywords and keep it under 60 characters.`;
        break;
      
      case 'sentiment':
        prompt = `Analyze the sentiment and virality potential of this content: "${content}". 
        Provide insights on:
        1. Sentiment (positive/negative/neutral)
        2. Viral potential (1-10 scale)
        3. Why it might go viral
        4. Target audience
        5. Suggested platforms for maximum reach`;
        break;
      
      case 'hashtags':
        prompt = `Generate 10 relevant hashtags for ${platform || 'instagram'} about: "${content}". 
        Mix popular and niche hashtags. 
        Include trending hashtags if relevant. 
        Format as: #hashtag1 #hashtag2 #hashtag3...`;
        break;
      
      case 'rewrite':
        prompt = `Rewrite this content for ${platform || 'social media'}: "${content}". 
        Make it more engaging and viral-worthy while maintaining the core message.`;
        break;
      
      case 'bio':
        prompt = `Generate a social media bio for ${platform || 'instagram'} based on: "${content}". 
        Make it engaging, include relevant keywords, and keep it under 150 characters.`;
        break;
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Unsupported feature type'
          })
        };
    }

    // Call AIMLAPI
    const response = await aimlapi.chat({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 500
    });

    // Extract the response content
    const result = response.choices?.[0]?.message?.content || 'No response generated';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result,
        provider: 'AIMLAPI',
        model: model,
        type: type
      })
    };

  } catch (error) {
    console.error('AI Feature Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process AI feature request',
        details: error.message
      })
    };
  }
}; 