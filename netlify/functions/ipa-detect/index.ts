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
    
    // Try using Google Tagging first (usually available without additional subscriptions)
    let response = await fetch(`https://api.cloudinary.com/v2/analysis/${cloudName}/analyze/google_tagging`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        source: {
          uri: imageUrl
        }
      })
    });
    
    // If Google Tagging fails, try AI Vision as fallback
    if (!response.ok) {
      console.log('🔄 [IPA Detect] Google Tagging failed, trying AI Vision...');
      response = await fetch(`https://api.cloudinary.com/v2/analysis/${cloudName}/analyze/ai_vision_general`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
        },
        body: JSON.stringify({
          source: {
            uri: imageUrl
          },
          prompt: "How many human faces are visible in this image? Count each distinct face and respond with just the number."
        })
      });
    }
    
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
    console.log('🤖 [IPA Detect] Cloudinary response:', JSON.stringify(result, null, 2));
    
    // Extract face count from response
    let faceCount = 1; // Default fallback
    
    // Handle Google Tagging response
    if (result.data?.analysis?.tags) {
      const tags = result.data.analysis.tags;
      console.log('🤖 [IPA Detect] Google Tagging tags:', tags);
      
      // Look for person-related tags to estimate face count
      const personTags = tags.filter(tag => 
        tag.toLowerCase().includes('person') || 
        tag.toLowerCase().includes('people') ||
        tag.toLowerCase().includes('face') ||
        tag.toLowerCase().includes('portrait')
      );
      
      if (personTags.length > 0) {
        // Simple heuristic: if multiple person tags, likely multiple people
        faceCount = personTags.length > 1 ? Math.min(personTags.length, 3) : 1;
      }
    }
    // Handle AI Vision response
    else if (result.data?.analysis?.response) {
      const aiResponse = result.data.analysis.response.toLowerCase();
      
      // Try to extract number from AI response
      const numberMatch = aiResponse.match(/\b(\d+)\b/);
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
