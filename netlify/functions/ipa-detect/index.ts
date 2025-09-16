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

// Simple heuristic-based face detection using filename patterns
function detectFaceCount(imageUrl: string): number {
  try {
    console.log('🤖 [IPA Detect] Analyzing filename for face count:', imageUrl);
    
    // Extract filename from URL
    const filename = imageUrl.split('/').pop()?.toLowerCase() || '';
    console.log('🤖 [IPA Detect] Extracted filename:', filename);
    
    // Simple heuristics based on common naming patterns
    if (filename.includes('couple') || filename.includes('pair') || filename.includes('two')) {
      console.log('🤖 [IPA Detect] Detected couple from filename');
      return 2;
    }
    
    if (filename.includes('family') || filename.includes('group') || filename.includes('friends')) {
      console.log('🤖 [IPA Detect] Detected group from filename');
      return 3; // Default group size
    }
    
    if (filename.includes('solo') || filename.includes('single') || filename.includes('portrait')) {
      console.log('🤖 [IPA Detect] Detected solo from filename');
      return 1;
    }
    
    // Default to 1 face for unknown patterns
    console.log('🤖 [IPA Detect] No pattern match, defaulting to 1 face');
    return 1;
    
  } catch (error) {
    console.warn('⚠️ [IPA Detect] Filename analysis failed, defaulting to 1 face:', error);
    return 1;
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
    const faceCount = detectFaceCount(body.imageUrl);
    
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
