// Mock AI responses for now - can be replaced with actual AI service later
const mockAIResponses = {
  caption: {
    instagram: "🔥 This is absolutely incredible! The way everything comes together is just mind-blowing. What do you think? Drop a ❤️ if you agree! #viral #trending #amazing",
    twitter: "This is the kind of content that makes you stop and think. Absolutely brilliant! 🤯 #viral #trending #mindblown",
    tiktok: "This is literally everything rn 🔥 #fyp #viral #trending"
  },
  tweet: {
    viral: "This just changed everything I thought I knew. Mind = blown 🤯 #viral #trending #gamechanger",
    professional: "Fascinating insights on this topic. The implications are significant for our industry. #innovation #trending",
    casual: "Okay but this is actually amazing tho 👀 #viral #trending"
  },
  hashtags: {
    instagram: "#viral #trending #amazing #incredible #mindblown #gamechanger #innovation #fyp #trendingnow #viralcontent",
    twitter: "#viral #trending #mindblown #gamechanger #innovation #trendingnow #viralcontent #amazing #incredible",
    tiktok: "#fyp #viral #trending #amazing #incredible #mindblown #gamechanger #innovation #trendingnow"
  },
  sentiment: "This content shows strong positive sentiment with high viral potential (8/10). It's engaging, relatable, and has broad appeal. Target audience: 18-35 demographic. Best platforms: Instagram, TikTok, Twitter.",
  title: "This Will Change Everything You Know About [Topic]",
  bio: "Creating viral content that makes people think 🤯 | Innovation enthusiast | Trending topics expert | Let's make waves together 🌊"
};

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

    // Generate response based on feature type
    let result = '';

    switch (type) {
      case 'caption':
        result = mockAIResponses.caption[platform || 'instagram'] || mockAIResponses.caption.instagram;
        break;
      
      case 'tweet':
        result = mockAIResponses.tweet[style || 'viral'] || mockAIResponses.tweet.viral;
        break;
      
      case 'reddit':
        result = `**Title:** ${content}\n\n**Body:** This is an engaging Reddit post about ${content}. It follows community guidelines and encourages discussion. What are your thoughts on this topic?`;
        break;
      
      case 'title':
        result = mockAIResponses.title;
        break;
      
      case 'sentiment':
        result = mockAIResponses.sentiment;
        break;
      
      case 'hashtags':
        result = mockAIResponses.hashtags[platform || 'instagram'] || mockAIResponses.hashtags.instagram;
        break;
      
      case 'rewrite':
        result = `Here's a more engaging version: ${content} - This content has been rewritten to be more viral-worthy while maintaining the core message. It's now more engaging and shareable!`;
        break;
      
      case 'bio':
        result = mockAIResponses.bio;
        break;
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid feature type'
          })
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result: result,
        type: type,
        platform: platform || 'general'
      })
    };

  } catch (error) {
    console.error('AI Features Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
}; 