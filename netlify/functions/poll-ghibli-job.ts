// netlify/functions/poll-ghibli-job.ts
// Ghibli Reaction Job Status Polling
// 
// 🎯 PURPOSE: Check the status of Ghibli generation jobs
// 📋 FLOW: 1. Get job ID from query params 2. Fetch job status from database 3. Return current status
// 🔄 INTEGRATION: Works with start-ghibli-job.ts for complete async flow

import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';



export const handler: Handler = async (event, context) => {
  console.log('📊 [Ghibli] Polling job status...');
  
  try {
    // Extract job ID from query parameters
    const jobId = event.queryStringParameters?.jobId;
    
    if (!jobId) {
      console.error('❌ [Ghibli] Missing jobId parameter');
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Missing jobId parameter' 
        })
      };
    }
    
    console.log('🔍 [Ghibli] Checking status for job:', jobId);
    
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
    
    // Fetch job status from database
    try {
      const jobRecord = await q(ghibliReactionMedia.findUnique({
        where: { id: jobId }
      });
      
      if (!jobRecord) {
        console.error('❌ [Ghibli] Job not found:', jobId);
        return {
          statusCode: 404,
          body: JSON.stringify({ 
            ok: false, 
            error: 'Job not found' 
          })
        };
      }
      
      // Verify job belongs to authenticated user
      if (jobRecord.userId !== userId) {
        console.error('❌ [Ghibli] Job access denied - user mismatch:', { jobUserId: jobRecord.userId, requestUserId: userId });
        return {
          statusCode: 403,
          body: JSON.stringify({ 
            ok: false, 
            error: 'Access denied' 
          })
        };
      }
      
      console.log('✅ [Ghibli] Job status retrieved:', { jobId, status: jobRecord.status });
      
      // Return job status
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          jobId: jobRecord.id,
          status: jobRecord.status,
          prompt: jobRecord.prompt,
          presetKey: jobRecord.presetKey,
          sourceUrl: jobRecord.sourceUrl,
          imageUrl: jobRecord.imageUrl || null,
          errorMessage: jobRecord.errorMessage || null,
          createdAt: jobRecord.createdAt,
          updatedAt: jobRecord.updatedAt
        })
      };
      
    } catch (error) {
      console.error('❌ [Ghibli] Database query failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          ok: false, 
          error: 'Failed to retrieve job status' 
        })
      };
    }
    
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
    await q($disconnect();
  }
};
