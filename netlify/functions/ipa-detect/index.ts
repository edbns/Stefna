// netlify/functions/ipa-detect.ts
// Separate function for face detection to avoid size limits on main function

import { Handler } from '@netlify/functions';

interface FaceDetectionRequest {
  imageUrl: string;
}

interface FaceDetectionResponse {
  success: boolean;
  faceCount: number;
  error?: string;
}

// Helper function to detect faces and get face count from source image
async function detectFaceCount(imageUrl: string): Promise<number> {
  try {
    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid imageUrl passed to detectFaceCount()');
    }
    
    if (!imageUrl.startsWith('http')) {
      throw new Error('ImageUrl must be a valid HTTP URL');
    }
    
    console.log('🤖 [IPA Detect] Starting face detection for:', imageUrl.substring(0, 50) + '...');
    
    // Import face-api and canvas for Node.js environment
    const faceapi = require('@vladmandic/face-api');
    const canvas = require('canvas');
    const path = require('path');
    const { Canvas, Image, ImageData } = canvas;
    
    // Monkey patch the environment to use Node.js canvas
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    
    // Load the SSD MobileNet v1 model from local path
    const modelPath = path.resolve(__dirname, './face-api-models');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    
    // Load the image using canvas
    const img = await canvas.loadImage(imageUrl);
    
    // Detect all faces in the image
    const detections = await faceapi.detectAllFaces(img);
    const faceCount = detections.length;
    
    console.log(`🤖 [IPA Detect] Detected ${faceCount} faces from image`);
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
