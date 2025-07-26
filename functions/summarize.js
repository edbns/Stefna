// Netlify function for AI summarization
import axios from 'axios';

export const handler = async (event, context) => {
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
    const { videoId, content } = JSON.parse(event.body || '{}');
    
    if (!videoId && !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Video ID or content is required' })
      };
    }

    let videoContent = content;

    // If videoId is provided, fetch video details from YouTube
    if (videoId && !content) {
      const apiKey = process.env.YOUTUBE_API_KEY;
      
      if (!apiKey) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'YouTube API key not configured' })
        };
      }

      const videoResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
      );

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Video not found' })
        };
      }

      const video = videoResponse.data.items[0];
      videoContent = `${video.snippet.title}\n\n${video.snippet.description}`;
    }

    // Use OpenAI API for summarization (if configured)
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (openaiKey) {
      return await generateOpenAISummary(videoContent, openaiKey, headers);
    } else {
      // Fallback to simple keyword extraction
      return await generateSimpleSummary(videoContent, headers);
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

async function generateOpenAISummary(content, apiKey, headers) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes YouTube video content and provides concise, insightful summaries. Focus on key topics, main points, and actionable insights.'
          },
          {
            role: 'user',
            content: `Please analyze this YouTube video content and provide a comprehensive summary:\n\n${content}`
          }
        ],
        max_tokens: 500,
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
    return await generateSimpleSummary(content, headers);
  }
}

async function generateSimpleSummary(content, headers) {
  // Simple keyword extraction and summary generation
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const keywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 3).join('. ') + '.';

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      summary,
      keywords,
      method: 'simple',
      confidence: 'medium'
    })
  };
}