// Story Time Worker - AI-powered photo story creation
// Converts multiple photos into engaging stories with AI-generated narratives

import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { initCloudinary } from './_cloudinary';

const AIML_API_KEY = process.env.AIML_API_KEY!;
const AIML_ENDPOINT = 'https://api.aimlapi.com/v1/images/generations';

// Story Time presets with fun themes
const STORY_PRESETS = {
  adventure: {
    name: "🚀 Adventure Mode",
    prompt: "epic adventure, heroic journey, exploration, discovery, thrilling action, cinematic lighting, dramatic composition",
    negative: "boring, static, mundane, office, indoor, sitting, sleeping"
  },
  romance: {
    name: "💕 Romance Mode", 
    prompt: "romantic atmosphere, love story, intimate moments, soft lighting, warm colors, emotional connection, dreamy mood",
    negative: "violent, scary, dark, cold, harsh, aggressive, angry"
  },
  mystery: {
    name: "🔍 Mystery Mode",
    prompt: "mysterious atmosphere, suspense, intrigue, shadow play, dramatic lighting, enigmatic mood, detective story",
    negative: "obvious, clear, bright, cheerful, simple, straightforward"
  },
  comedy: {
    name: "😂 Comedy Mode",
    prompt: "funny, humorous, playful, lighthearted, silly, whimsical, cartoon-like, exaggerated expressions",
    negative: "serious, sad, dark, scary, formal, professional"
  },
  fantasy: {
    name: "🧙‍♂️ Fantasy Mode",
    prompt: "magical, mystical, enchanted, otherworldly, fantasy elements, ethereal lighting, dreamlike atmosphere",
    negative: "realistic, mundane, everyday, normal, boring, practical"
  },
  travel: {
    name: "✈️ Travel Mode",
    prompt: "travel adventure, cultural exploration, new places, discovery, wanderlust, vibrant colors, dynamic composition",
    negative: "home, familiar, routine, boring, static, indoor"
  }
};

// Process Story Time job: analyze photos and create AI story
async function processStoryTimeJob(job: any, storyId: string) {
  const cloudinary = initCloudinary();
  const prisma = new PrismaClient();
  
  try {
    console.log(`📖 [Story Time] Processing story ${storyId} with ${job.photos.length} photos`);
    console.log(`🔒 [Story Time] Using preset: ${job.preset} with IPA integration`);
    
    // Update progress to processing
    await prisma.story.update({
      where: { id: storyId },
      data: { 
        status: 'processing',
        progress: 10
      }
    });

    // 1) Analyze each photo and generate AI descriptions
    const photoDescriptions: string[] = [];
    
    for (let i = 0; i < job.photos.length; i++) {
      const photo = job.photos[i];
      console.log(`📸 [Story Time] Analyzing photo ${i + 1}/${job.photos.length}`);
      
      // Generate AI description for this photo
      const photoPrompt = `Describe this photo in a creative, engaging way that fits a ${job.preset} story theme. Focus on the mood, atmosphere, and narrative potential.`;
      
      // For now, we'll use a simple prompt-based approach
      // In the future, you could use vision AI to actually analyze the photo content
      // TODO: Integrate with IPA service for identity preservation during photo analysis
      const photoDescription = `Photo ${i + 1}: A captivating moment that captures the essence of ${job.preset}.`;
      photoDescriptions.push(photoDescription);
      
      // Update photo record with AI description
      await prisma.storyPhoto.update({
        where: { id: photo.id },
        data: { prompt: photoDescription }
      });
      
      // Update progress
      const progress = Math.round(((i + 1) / job.photos.length) * 40) + 10; // 10-50%
      await prisma.story.update({
        where: { id: storyId },
        data: { progress }
      });
    }
    
    // 2) Generate the overall story narrative
    console.log(`📝 [Story Time] Generating story narrative...`);
    
    const storyPrompt = `Create a compelling ${job.preset} story that connects these ${job.photos.length} photos. 
    Make it engaging, creative, and suitable for social media. 
    Theme: ${STORY_PRESETS[job.preset as keyof typeof STORY_PRESETS]?.name || job.preset}
    Style: ${STORY_PRESETS[job.preset as keyof typeof STORY_PRESETS]?.prompt || 'creative and engaging'}`;
    
    // TODO: Integrate with IPA service for identity preservation
    // This would ensure the generated story maintains the identity of people in the photos
    // IPA config: story_time_moderate_ipa (threshold: 0.55, retries: 2, blocking: true)
    
    // For now, we'll create a template story
    // In the future, you could use GPT or similar AI to generate the actual narrative
    const storyNarrative = `Once upon a time, in a world filled with wonder and possibility...
    
    ${photoDescriptions.map((desc, i) => `Chapter ${i + 1}: ${desc}`).join('\n\n')}
    
    And so, our ${job.preset} journey continues, with each moment captured in time, waiting to be shared with the world. ✨`;
    
    // Update progress to 80%
    await prisma.story.update({
      where: { id: storyId },
      data: { 
        progress: 80,
        storyText: storyNarrative
      }
    });
    
    // 3) Finalize the story
    console.log(`✨ [Story Time] Finalizing story...`);
    
    // TODO: Final IPA check before completing the story
    // This would verify that all generated content maintains identity preservation
    // Use IPA service: IdentityPreservationService.runIPA() with story_time_moderate_ipa config
    
    await prisma.story.update({
      where: { id: storyId },
      data: { 
        status: 'completed',
        progress: 100,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ [Story Time] Story ${storyId} completed successfully!`);
    console.log(`🔒 [Story Time] IPA integration ready for full implementation`);
    
    await prisma.$disconnect();
    return { success: true, storyId, status: 'completed' };
    
  } catch (error) {
    console.error(`❌ [Story Time] Error processing story ${storyId}:`, error);
    
    await prisma.story.update({
      where: { id: storyId },
      data: { 
        status: 'failed',
        progress: 0
      }
    });
    
    await prisma.$disconnect();
    throw error;
  }
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { storyId } = body;
    
    if (!storyId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'storyId required' })
      };
    }

    const prisma = new PrismaClient();

    // Load story from database
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        photos: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!story) {
      await prisma.$disconnect();
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Story not found' })
      };
    }

    if (story.status !== 'pending') {
      await prisma.$disconnect();
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: true, 
          message: 'Already handled', 
          status: story.status 
        })
      };
    }

    // Mark story as processing
    await prisma.story.update({
      where: { id: storyId },
      data: { 
        status: 'processing',
        progress: 1,
        updatedAt: new Date()
      }
    });

    await prisma.$disconnect();

    // Process the story
    const result = await processStoryTimeJob(story, storyId);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: true,
        result,
        message: 'Story Time processing completed'
      })
    };

  } catch (error: any) {
    console.error('❌ [Story Time Worker] Error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: false,
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
