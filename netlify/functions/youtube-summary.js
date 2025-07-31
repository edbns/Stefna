const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Debug logging
  console.log("YouTube summary function called");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Request body:", event.body);
  
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
    const { url } = JSON.parse(event.body || '{}');
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'YouTube URL is required' })
      };
    }

    // Extract video ID from YouTube URL
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid YouTube URL' })
      };
    }

    // Get video details from YouTube API
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    // Debug logging
    console.log("YouTube API Key found:", !!process.env.YOUTUBE_API_KEY);
    console.log("YouTube API Key length:", process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY.length : 0);
    console.log("All environment variables:", Object.keys(process.env).filter(key => key.includes('API')));
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'YouTube API key not configured',
          message: 'Please set YOUTUBE_API_KEY in Netlify environment variables'
        })
      };
    }

    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`
    );

    if (!videoResponse.ok) {
      throw new Error(`YouTube API failed: ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Video not found' })
      };
    }

    const video = videoData.items[0];
    const snippet = video.snippet;
    const statistics = video.statistics;
    const contentDetails = video.contentDetails;

    // Generate AI summary using multiple providers
    const summaryPrompt = `Please provide a concise summary of this YouTube video:

Title: ${snippet.title}
Description: ${snippet.description}
Duration: ${contentDetails.duration}
Views: ${statistics.viewCount}
Likes: ${statistics.likeCount}

Please provide:
1. A 2-3 sentence summary
2. 3-5 key points
3. Overall sentiment (positive/neutral/negative)
4. Main topics discussed
5. Confidence score (1-100)

Format as JSON with fields: summary, keyPoints, sentiment, topics, confidence`;

    // AI Provider configurations for summary
    const AI_PROVIDERS = [
      {
        name: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://stefna.xyz',
          'X-Title': 'Stefna YouTube Summarizer'
        },
        transformRequest: (prompt) => ({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes YouTube videos. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
        transformResponse: (data) => data.choices?.[0]?.message?.content || null
      },
      {
        name: 'deepinfra',
        apiKey: process.env.DEEPINFRA_API_KEY,
        endpoint: 'https://api.deepinfra.com/v1/openai/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt) => ({
          model: 'meta-llama/Llama-2-70b-chat-hf',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes YouTube videos. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
        transformResponse: (data) => data.choices?.[0]?.message?.content || null
      },
      {
        name: 'together',
        apiKey: process.env.TOGETHER_API_KEY,
        endpoint: 'https://api.together.xyz/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt) => ({
          model: 'togethercomputer/llama-2-70b-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes YouTube videos. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
        transformResponse: (data) => data.choices?.[0]?.message?.content || null
      },
      {
        name: 'groq',
        apiKey: process.env.GROQ_API_KEY,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        transformRequest: (prompt) => ({
          model: 'llama2-70b-4096',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes YouTube videos. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
        transformResponse: (data) => data.choices?.[0]?.message?.content || null
      }
    ].filter(provider => provider.apiKey);

    if (AI_PROVIDERS.length === 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No AI API keys configured',
          message: 'Please set at least one AI API key (OPENROUTER_API_KEY, DEEPINFRA_API_KEY, TOGETHER_API_KEY, or GROQ_API_KEY) in Netlify environment variables'
        })
      };
    }

    // Try each AI provider in order
    let aiContent = null;
    for (const provider of AI_PROVIDERS) {
      try {
        console.log(`Trying ${provider.name} for YouTube summary...`);
        
        const requestBody = provider.transformRequest(summaryPrompt);
        
        const aiResponse = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.headers,
          body: JSON.stringify(requestBody)
        });

        if (!aiResponse.ok) {
          throw new Error(`HTTP ${aiResponse.status}: ${aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();
        aiContent = provider.transformResponse(aiData);
        
        if (aiContent) {
          console.log(`Success with ${provider.name}`);
          break;
        }
      } catch (error) {
        console.error(`${provider.name} failed:`, error);
        // Continue to next provider
      }
    }

    // Parse AI response
    let summaryData;
    try {
      summaryData = JSON.parse(aiContent);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      summaryData = {
        summary: aiContent,
        keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
        sentiment: 'neutral',
        topics: ['Technology', 'AI', 'Innovation'],
        confidence: 85
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary: summaryData.summary || aiContent,
        keyPoints: summaryData.keyPoints || ['Key point 1', 'Key point 2', 'Key point 3'],
        sentiment: summaryData.sentiment || 'neutral',
        topics: summaryData.topics || ['Technology', 'AI', 'Innovation'],
        confidence: summaryData.confidence || 85,
        duration: contentDetails.duration,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        viewCount: statistics.viewCount,
        likeCount: statistics.likeCount
      })
    };

  } catch (error) {
    console.error('YouTube summary error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate summary',
        message: error.message 
      })
    };
  }
}; 