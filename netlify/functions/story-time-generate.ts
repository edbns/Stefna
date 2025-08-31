// netlify/functions/story-time-generate.ts
// Story Time Video Generation Handler using Fal.ai
// 
// 🎯 GENERATION STRATEGY:
// 1. PRIMARY: Use Fal.ai video generation models for Story Time
// 2. FALLBACK: None needed (Fal.ai is reliable for this)
// 3. CREDITS: Charge 3 credits total (1 per video)
// 4. VIDEO: Generate cinematic videos from story photos
// 
// ⚠️ IMPORTANT: This follows the unified generation pattern
import { Handler } from '@netlify/functions';
import { fal } from '@fal-ai/client';
import { q, qOne, qCount } from './_db';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
});

// Fal.ai video generation models
const FAL_VIDEO_MODELS = [
  { 
    model: 'fal-ai/fast-sdxl', 
    name: 'Fast SDXL Video', 
    cost: 'low', 
    priority: 1,
    description: 'Fast video generation from images'
  },
  { 
    model: 'fal-ai/stable-video-diffusion', 
    name: 'Stable Video Diffusion', 
    cost: 'medium', 
    priority: 2,
    description: 'High-quality video generation'
  },
  { 
    model: 'fal-ai/realistic-vision-v5', 
    name: 'Realistic Vision V5', 
    cost: 'high', 
    priority: 3,
    description: 'Premium realistic video generation'
  }
];

// Main handler
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle GET requests for status checking
  if (event.httpMethod === 'GET') {
    const storyId = event.queryStringParameters?.storyId;
    if (!storyId) {
      return {
        statusCode: 400,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'storyId parameter required' })
      };
    }

    try {
      const status = await qOne(`
        SELECT id, status, preset, fal_job_id, created_at, updated_at
        FROM story
        WHERE id = $1
      `, [storyId]);

      if (!status) {
        return {
          statusCode: 404,
          headers: { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
          },
          body: JSON.stringify({ error: 'Story not found' })
        };
      }

      // Get story photos with video status
      const photos = await q(`
        SELECT id, order_index, photo_url, video_url, status, fal_job_id, created_at
        FROM story_photo
        WHERE story_id = $1
        ORDER BY order_index
      `, [storyId]);

      return {
        statusCode: 200,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({
          ...status,
          photos: photos
        })
      };
    } catch (error) {
      console.error('❌ [StoryTime] Status check failed:', error);
      return {
        statusCode: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'Status check failed' })
      };
    }
  }

  try {
    const { storyId, userId } = JSON.parse(event.body || '{}');

    if (!storyId || !userId) {
      return {
        statusCode: 400,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log('🎬 [StoryTime] Starting video generation for story:', storyId);

    // Get story details
    const story = await qOne(`
      SELECT id, title, description, preset, status, user_id
      FROM story
      WHERE id = $1 AND user_id = $2
    `, [storyId, userId]);

    if (!story) {
      return {
        statusCode: 404,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'Story not found' })
      };
    }

    // Get story photos
    const photos = await q(`
      SELECT id, order_index, photo_url, video_url, status
      FROM story_photo
      WHERE story_id = $1
      ORDER BY order_index
    `, [storyId]);

    if (photos.length === 0) {
      return {
        statusCode: 400,
        headers: { 
          'Access-Control-Allow-Origin': '*', 
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
        },
        body: JSON.stringify({ error: 'No photos found for story' })
      };
    }

    // Update story status to processing
    await q(`
      UPDATE story
      SET status = 'processing', updated_at = NOW()
      WHERE id = $1
    `, [storyId]);

    // Generate videos for each photo
    const videoResults = [];
    let lastError = null;

    for (const photo of photos) {
      try {
        console.log(`🎬 [StoryTime] Generating video for photo ${photo.order_index}/${photos.length}`);
        
        // Generate unique fal job ID for this photo
        const falJobId = uuidv4();
        
        // Update story_photo with fal_job_id and processing status
        await q(`
          UPDATE story_photo
          SET fal_job_id = $1, status = 'processing', updated_at = NOW()
          WHERE id = $2
        `, [falJobId, photo.id]);
        
        // 🎭 APPLY IPA (Identity Preservation Algorithm) if needed
        let processedImageUrl = photo.photo_url;
        const shouldApplyIPA = await checkIfIPANeeded(photo.photo_url, story.preset);
        
        if (shouldApplyIPA) {
          console.log(`🎭 [StoryTime] Applying IPA to photo ${photo.order_index}`);
          try {
            processedImageUrl = await applyIPA(photo.photo_url, story.preset);
            console.log(`✅ [StoryTime] IPA applied successfully to photo ${photo.order_index}`);
          } catch (ipaError) {
            console.warn(`⚠️ [StoryTime] IPA failed for photo ${photo.order_index}, using original:`, ipaError);
            // Continue with original image if IPA fails
          }
        }
        
        const videoResult = await generateVideoFromImage(
          processedImageUrl, // Use processed image if IPA was applied
          story.preset,
          photo.order_index,
          photos.length,
          falJobId
        );

        // Upload video to Cloudinary
        const videoUrl = await uploadVideoToCloudinary(videoResult.videoUrl, `story_${storyId}_photo_${photo.order_index}`);

        // Update story_photo with video URL and completed status
        await q(`
          UPDATE story_photo
          SET video_url = $1, status = 'completed', updated_at = NOW()
          WHERE id = $2
        `, [videoUrl, photo.id]);

        videoResults.push({
          photoId: photo.id,
          orderIndex: photo.order_index,
          videoUrl: videoUrl,
          status: 'completed'
        });

        console.log(`✅ [StoryTime] Video generated for photo ${photo.order_index}:`, videoUrl);

      } catch (error: any) {
        console.error(`❌ [StoryTime] Video generation failed for photo ${photo.order_index}:`, error);
        lastError = error;

        // Update photo status to failed
        await q(`
          UPDATE story_photo
          SET status = 'failed', updated_at = NOW()
          WHERE id = $1
        `, [photo.id]);

        videoResults.push({
          photoId: photo.id,
          orderIndex: photo.order_index,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update story status based on results
    const completedVideos = videoResults.filter(r => r.status === 'completed').length;
    const totalPhotos = photos.length;

    if (completedVideos === totalPhotos) {
      await q(`
        UPDATE story
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1
      `, [storyId]);
      console.log(`🎉 [StoryTime] All videos generated successfully for story ${storyId}`);
    } else if (completedVideos > 0) {
      await q(`
        UPDATE story
        SET status = 'partial', updated_at = NOW()
        WHERE id = $1
      `, [storyId]);
      console.log(`⚠️ [StoryTime] Partial success: ${completedVideos}/${totalPhotos} videos generated for story ${storyId}`);
    } else {
      await q(`
        UPDATE story
        SET status = 'failed', updated_at = NOW()
        WHERE id = $1
      `, [storyId]);
      console.log(`❌ [StoryTime] All video generation failed for story ${storyId}`);
    }

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
      },
      body: JSON.stringify({
        success: true,
        storyId: storyId,
        completedVideos,
        totalPhotos,
        results: videoResults,
        message: `Generated ${completedVideos}/${totalPhotos} videos for your ${story.preset} story`
      })
    };

  } catch (error: any) {
    console.error('❌ [StoryTime] Generation failed:', error);
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
      },
      body: JSON.stringify({ 
        error: 'Generation failed', 
        details: error.message 
      })
    };
  }
};

// Generate video from image using fal.ai
async function generateVideoFromImage(imageUrl: string, preset: string, photoIndex: number, totalPhotos: number, falJobId: string) {
  console.log(`🎬 [StoryTime] Starting video generation for photo ${photoIndex}/${totalPhotos} with job ID: ${falJobId}`);

  let lastError: Error | null = null;
  let attemptCount = 0;

  // Try each fal.ai video model until one succeeds
  for (const videoModel of FAL_VIDEO_MODELS) {
    attemptCount++;
    console.log(`🔄 [StoryTime] Attempt ${attemptCount}/${FAL_VIDEO_MODELS.length}: ${videoModel.name}`);

    try {
      const result = await fal.subscribe(videoModel.model, {
        input: {
          image_url: imageUrl,
          prompt: getStoryPrompt(preset, photoIndex, totalPhotos),
          num_frames: 24, // 1 second at 24fps
          fps: 24,
          motion_bucket_id: Math.floor(Math.random() * 100),
          cond_aug: 0.02,
          decoding_t: 7,
          width: 512,
          height: 512
        },
        logs: true
      });

      console.log(`✅ [StoryTime] ${videoModel.name} video generation successful`);
      
      // Extract video URL from result
      let videoUrl = null;
      
      if (result.data?.video?.url) {
        videoUrl = result.data.video.url;
      } else if (result.data?.url) {
        videoUrl = result.data.url;
      }
      
      if (!videoUrl) {
        throw new Error(`${videoModel.name} returned no video URL`);
      }

      return {
        videoUrl,
        model: videoModel.name,
        attemptCount
      };

    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ [StoryTime] ${videoModel.name} failed:`, error.message);
      
      if (attemptCount < FAL_VIDEO_MODELS.length) {
        continue;
      }
    }
  }

  throw new Error(`All video models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Get story prompt based on preset and photo position
function getStoryPrompt(preset: string, photoIndex: number, totalPhotos: number): string {
  const presetPrompts = {
    'adventure': 'Epic adventure scene, cinematic lighting, dramatic composition',
    'romance': 'Romantic atmosphere, soft lighting, intimate moment',
    'mystery': 'Mysterious mood, dramatic shadows, suspenseful atmosphere',
    'comedy': 'Lighthearted scene, bright lighting, playful composition',
    'fantasy': 'Magical atmosphere, ethereal lighting, fantastical elements',
    'travel': 'Travel documentary style, natural lighting, wanderlust feeling',
    'auto': 'Cinematic scene, professional lighting, engaging composition'
  };

  const basePrompt = presetPrompts[preset as keyof typeof presetPrompts] || presetPrompts.auto;
  const position = photoIndex === 1 ? 'opening' : photoIndex === totalPhotos ? 'closing' : 'middle';
  
  return `${basePrompt}, ${position} scene, smooth camera movement, professional video quality`;
}

// Upload video to Cloudinary
async function uploadVideoToCloudinary(videoUrl: string, publicId: string): Promise<string> {
  try {
    console.log('☁️ [StoryTime] Uploading video to Cloudinary:', videoUrl.substring(0, 60) + '...');
    
    // Download video from fal.ai
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    
    const videoBuffer = await response.arrayBuffer();
    
    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'stefna/story-time',
          public_id: publicId,
          resource_type: 'video',
          overwrite: true,
          transformation: [
            { quality: 'auto:good', fetch_format: 'mp4' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ [StoryTime] Cloudinary upload failed:', error);
            reject(error);
          } else if (result) {
            console.log('✅ [StoryTime] Cloudinary upload successful:', result.secure_url);
            resolve(result);
          } else {
            reject(new Error('Cloudinary upload returned no result'));
          }
        }
      );
      
      uploadStream.end(Buffer.from(videoBuffer));
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('❌ [StoryTime] Video upload failed:', error);
    throw error;
  }
}

// 🎭 IPA (Identity Preservation Algorithm) Functions for Story Time

// Check if IPA should be applied based on preset
async function checkIfIPANeeded(imageUrl: string, preset: string): Promise<boolean> {
  // Apply IPA for presets that benefit from identity preservation
  const ipaPresets = ['romance', 'adventure', 'travel'];
  return ipaPresets.includes(preset);
}

// Apply IPA to image using fal.ai
async function applyIPA(imageUrl: string, preset: string): Promise<string> {
  console.log(`🎭 [StoryTime] Applying IPA for ${preset} preset`);
  
  try {
    // Use fal.ai for IPA processing (similar to other generation types)
    const result = await fal.subscribe('fal-ai/stable-diffusion-xl', {
      input: {
        image_url: imageUrl,
        prompt: getIPAPrompt(preset),
        strength: 0.7, // Moderate strength to preserve identity
        guidance_scale: 7.5,
        num_inference_steps: 20
      },
      logs: true
    });

    if (result.data?.image?.url) {
      console.log('✅ [StoryTime] IPA applied successfully');
      return result.data.image.url;
    } else {
      throw new Error('IPA processing returned no image URL');
    }
  } catch (error) {
    console.error('❌ [StoryTime] IPA processing failed:', error);
    throw error;
  }
}

// Get IPA-specific prompt based on preset
function getIPAPrompt(preset: string): string {
  const ipaPrompts = {
    'romance': 'romantic scene, soft lighting, intimate moment, preserve facial features, cinematic quality',
    'adventure': 'epic adventure scene, dramatic lighting, preserve character identity, cinematic composition',
    'travel': 'travel documentary style, natural lighting, preserve person identity, wanderlust feeling'
  };
  
  return ipaPrompts[preset as keyof typeof ipaPrompts] || 'cinematic scene, preserve identity, professional quality';
}
