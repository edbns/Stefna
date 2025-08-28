// netlify/functions/start-ghibli-job.ts
// Async Ghibli Reaction Generation Job Starter
// 
// 🎯 PURPOSE: Start Ghibli generation jobs asynchronously to prevent timeouts
// 📋 FLOW: 1. Create job record 2. Reserve credits 3. Start background processing 4. Return job ID instantly
// 🔄 INTEGRATION: Works with poll-ghibli-job.ts for status checking

import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// 🚀 BACKGROUND MODE: Allow function to run for up to 15 minutes
export const config = {
  type: "background",
};

const prisma = new PrismaClient();

export const handler: Handler = async (event, context) => {
  console.log('🚀 [Ghibli] Starting async job creation...');
  
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { prompt, presetKey, sourceUrl } = body;
    
    // Validate required fields
    if (!prompt || !presetKey || !sourceUrl) {
      console.error('❌ [Ghibli] Missing required fields:', { prompt: !!prompt, presetKey: !!presetKey, sourceUrl: !!sourceUrl });
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Missing required fields: prompt, presetKey, sourceUrl' 
        })
      };
    }
    
    // Extract user token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [Ghibli] Missing or invalid authorization header');
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Unauthorized - missing or invalid token' 
        })
      };
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 [Ghibli] User token extracted for credit calls');
    
    // Verify user and get user ID
    let userId: string;
    try {
      const userResponse = await fetch(`${process.env.URL}/.netlify/functions/whoami`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!userResponse.ok) {
        throw new Error(`User verification failed: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      userId = userData.id;
      console.log('✅ [Ghibli] User verified:', userId);
    } catch (error) {
      console.error('❌ [Ghibli] User verification failed:', error);
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          ok: false, 
          error: 'User verification failed' 
        })
      };
    }
    
    // Check user credits
    try {
      const creditsResponse = await fetch(`${process.env.URL}/.netlify/functions/check-credits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!creditsResponse.ok) {
        throw new Error(`Credit check failed: ${creditsResponse.status}`);
      }
      
      const creditsData = await creditsResponse.json();
      if (creditsData.credits < 1) {
        console.error('❌ [Ghibli] Insufficient credits:', creditsData.credits);
        return {
          statusCode: 402,
          body: JSON.stringify({ 
            ok: false, 
            error: 'Insufficient credits' 
          })
        };
      }
      
      console.log('✅ [Ghibli] Credits available:', creditsData.credits);
    } catch (error) {
      console.error('❌ [Ghibli] Credit check failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Credit check failed' 
        })
      };
    }
    
    // Create unique job ID
    const jobId = uuidv4();
    console.log('🆔 [Ghibli] Created job ID:', jobId);
    
    // Create job record in database
    try {
      const jobRecord = await prisma.ghibliReactionMedia.create({
        data: {
          id: jobId,
          userId: userId,
          prompt: prompt,
          presetKey: presetKey,
          sourceUrl: sourceUrl,
          status: 'processing',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ [Ghibli] Job record created:', jobRecord.id);
    } catch (error) {
      console.error('❌ [Ghibli] Failed to create job record:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Failed to create job record' 
        })
      };
    }
    
    // Reserve credits for the job
    try {
      const reserveResponse = await fetch(`${process.env.URL}/.netlify/functions/credits-reserve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'ghibli_reaction_generation',
          amount: 1,
          userId: userId,
          meta: { jobId, presetKey }
        })
      });
      
      if (!reserveResponse.ok) {
        throw new Error(`Credit reservation failed: ${reserveResponse.status}`);
      }
      
      console.log('✅ [Ghibli] Credits reserved successfully');
    } catch (error) {
      console.error('❌ [Ghibli] Credit reservation failed:', error);
      
      // Clean up job record if credit reservation fails
      try {
        await prisma.ghibliReactionMedia.delete({ where: { id: jobId } });
        console.log('🧹 [Ghibli] Cleaned up job record after credit reservation failure');
      } catch (cleanupError) {
        console.error('❌ [Ghibli] Failed to cleanup job record:', cleanupError);
      }
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Credit reservation failed' 
        })
      };
    }
    
    // Start background generation process
    console.log('🚀 [Ghibli] Starting background generation for job:', jobId);
    
    // Use setTimeout to call the background generation function
    // This allows us to respond immediately while processing continues
    setTimeout(async () => {
      try {
        const { startBackgroundGeneration } = await import('./ghibli-reaction-generate');
        await startBackgroundGeneration(jobId, prompt, presetKey, sourceUrl, userId);
      } catch (error) {
        console.error('❌ [Ghibli] Background generation failed:', error);
        
        // Update job status to failed
        try {
          await prisma.ghibliReactionMedia.update({
            where: { id: jobId },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              updatedAt: new Date()
            }
          });
        } catch (updateError) {
          console.error('❌ [Ghibli] Failed to update job status to failed:', updateError);
        }
      }
    }, 100); // Small delay to ensure response is sent first
    
    // Return success response immediately with job ID
    console.log('✅ [Ghibli] Job started successfully, returning job ID:', jobId);
    
    return {
      statusCode: 202, // Accepted
      body: JSON.stringify({
        ok: true,
        jobId: jobId,
        status: 'processing',
        message: 'Ghibli generation job started successfully'
      })
    };
    
  } catch (error) {
    console.error('❌ [Ghibli] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'Internal server error'
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
