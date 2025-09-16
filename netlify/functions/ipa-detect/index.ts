// IPA Detect Function - Uses Cloudinary AI Vision API for face detection

import { Handler } from '@netlify/functions';

interface FaceDetectionRequest {
  imageUrl: string;
}

interface FaceDetectionResponse {
  success: boolean;
  faceCount: number;
  error?: string;
}

// Detect faces using Cloudinary AI Vision API
async function detectFaceCount(imageUrl: string): Promise<number> {
  try {
    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid imageUrl passed to detectFaceCount()');
    }
    
    if (!imageUrl.startsWith('http')) {
      throw new Error('ImageUrl must be a valid HTTP URL');
    }
    
    console.log('🤖 [IPA Detect] Starting Cloudinary AI face detection for:', imageUrl.substring(0, 50) + '...');
    
    // Get Cloudinary credentials from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Missing Cloudinary credentials');
    }
    
    // Use Cloudinary AI Vision to detect faces
    const response = await fetch(`https://api.cloudinary.com/v2/analysis/${cloudName}/analyze/ai_vision_general`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        source: {
          uri: imageUrl
        },
        prompts: ["Count only the distinct human faces of actual people in this image. Do not count reflections, shadows, or faces in photos/pictures. How many real people are visible?"]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [IPA Detect] Cloudinary API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Cloudinary API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🤖 [IPA Detect] Cloudinary AI response:', JSON.stringify(result, null, 2));
    
    // Extract face count from AI response
    let faceCount = 1; // Default fallback
    
    if (result.data?.analysis?.responses && result.data.analysis.responses.length > 0) {
      const aiResponse = result.data.analysis.responses[0].value;
      console.log('🤖 [IPA Detect] AI response value:', aiResponse);
      
      // Extract number from AI response
      const numberMatch = aiResponse.toString().match(/\b(\d+)\b/);
      if (numberMatch) {
        faceCount = parseInt(numberMatch[1]);
        // Sanity check - reasonable face count range
        if (faceCount < 1 || faceCount > 10) {
          faceCount = 1;
        }
      }
    }
    
    console.log(`🤖 [IPA Detect] Detected ${faceCount} faces from Cloudinary AI`);
    return faceCount;
    
  } catch (error) {
    console.warn('⚠️ [IPA Detect] Face detection failed, defaulting to 1 face:', error);
    return 1; // Default to 1 face if detection fails
  }
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      })
    };
  }

  try {
    // Parse request body
    const body: FaceDetectionRequest = JSON.parse(event.body || '{}');
    
    if (!body.imageUrl) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing imageUrl in request body'
        })
      };
    }

    // Detect faces
    const faceCount = await detectFaceCount(body.imageUrl);
    
    const response: FaceDetectionResponse = {
      success: true,
      faceCount
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ [IPA Detect] Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        faceCount: 1, // Safe fallback
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
