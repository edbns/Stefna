// netlify/functions/test-3d-generation.ts
// Test function for Stability AI 3D generation
// This is a simple test to see if 3D generation works before UI changes

import { Handler } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { imageUrl, model = 'stable-fast-3d' } = JSON.parse(event.body || '{}');

    if (!imageUrl) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'imageUrl is required' })
      };
    }

    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_API_KEY) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'STABILITY_API_KEY not configured' })
      };
    }

    console.log(`🧪 [3D Test] Starting 3D generation with ${model}`);
    console.log(`🧪 [3D Test] Image URL: ${imageUrl}`);

    // Test the 3D generation endpoint
    const response = await fetch(`https://api.stability.ai/v2beta/3d/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        // Add any other parameters the API might need
      })
    });

    console.log(`🧪 [3D Test] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🧪 [3D Test] API Error:`, errorText);
      
      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `3D generation failed: ${response.status}`,
          details: errorText,
          model: model
        })
      };
    }

    const result = await response.json();
    console.log(`🧪 [3D Test] Success! Result keys:`, Object.keys(result));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        model: model,
        result: result,
        // Extract key info for easier debugging
        hasObj: !!result.obj_url || !!result.obj,
        hasGltf: !!result.gltf_url || !!result.gltf,
        hasTexture: !!result.texture_url || !!result.texture
      })
    };

  } catch (error) {
    console.error('🧪 [3D Test] Error:', error);
    
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
