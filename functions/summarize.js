// Netlify function for AI summarization
const axios = require('axios');

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
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text content is required' })
      };
    }

    // Use OpenAI API for summarization (if configured)
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (openaiKey) {
      return await generateOpenAISummary(text, maxLength, openaiKey, headers);
    } else {
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

async function generateOpenAISummary(text, maxLength, apiKey, headers) {
  try {
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
        }
      }
    );

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
    console.error('OpenAI API Error:', error);
    
    // Fallback to simple summary
    return await generateSimpleSummary(text, maxLength, headers);
  }
}

async function generateSimpleSummary(text, maxLength, headers) {
  // Simple summary generation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let summary = sentences.slice(0, 2).join('. ') + '.';
  
  // Truncate if too long
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength - 3) + '...';
  }

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