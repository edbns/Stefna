import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

interface IdentitySafeGenerationRequest {
  prompt: string;
  imageUrl: string;
  strength?: number;
  guidance?: number;
}

interface ReplicatePredictionResponse {
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get?: string;
    cancel?: string;
  };
}

interface IdentitySafeGenerationResponse {
  id: string;
  status: string;
  created_at: string;
  urls?: {
    get?: string;
    cancel?: string;
  };
  message: string;
}

const handler: Handler = async (event) => {
  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  try {
    const { prompt, imageUrl, strength = 0.7, guidance = 7.5 }: IdentitySafeGenerationRequest = 
      JSON.parse(event.body || '{}');

    // Validate required parameters
    if (!prompt || !imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters: prompt and imageUrl are required' 
        }),
      };
    }

    // Validate Replicate API key
    if (!process.env.REPLICATE_API_KEY) {
      console.error('REPLICATE_API_KEY environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Replicate API not configured' }),
      };
    }

    console.log('🚀 Starting identity-safe generation:', {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      imageUrl: imageUrl.substring(0, 100) + '...',
      strength,
      guidance,
      timestamp: new Date().toISOString()
    });

    // Call Replicate API for identity-safe generation
    const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "84f1bfa5a264ae8a4b9c77385b32f6b8bb717cdafdd6e21d30592b9b44da6a60", // zsxkib/infinite-you:sim_stage1
        input: {
          image: imageUrl,
          prompt: prompt,
          strength: strength,
          guidance_scale: guidance,
          num_inference_steps: 50,
          seed: Math.floor(Math.random() * 1000000), // Random seed for variety
        }
      }),
    });

    if (!replicateRes.ok) {
      const error = await replicateRes.json().catch(() => ({}));
      console.error('❌ Replicate API error:', {
        status: replicateRes.status,
        statusText: replicateRes.statusText,
        error: error?.detail || error?.error || 'Unknown error'
      });
      
      return {
        statusCode: replicateRes.status,
        headers,
        body: JSON.stringify({ 
          error: error?.detail || error?.error || replicateRes.statusText,
          status: replicateRes.status
        })
      };
    }

    const replicateData: ReplicatePredictionResponse = await replicateRes.json();
    
    console.log('✅ Identity-safe generation started successfully:', {
      predictionId: replicateData.id,
      status: replicateData.status,
      createdAt: replicateData.created_at
    });

    const response: IdentitySafeGenerationResponse = {
      id: replicateData.id,
      status: replicateData.status,
      created_at: replicateData.created_at,
      urls: replicateData.urls,
      message: 'Identity-safe generation started successfully'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (err) {
    const error = err as Error;
    console.error('💥 Identity-safe generation error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Unknown error occurred during identity-safe generation',
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export { handler };
