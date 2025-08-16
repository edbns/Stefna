// /.netlify/functions/video-job-status.ts
import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';
import { getAuthedUser } from '../lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Use new auth helper
  const { user, error } = await getAuthedUser(event);
  if (!user || error) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
  }

  const job_id = (event.queryStringParameters || {}).job_id;
  if (!job_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'job_id required' }) };
  }

  try {
    // Check if video_jobs table exists, if not return graceful error
    let data;
    try {
      data = await sql`
        SELECT id, status, result_url, error, provider_job_id, updated_at
        FROM video_jobs
        WHERE id = ${job_id}
        LIMIT 1
      `;
    } catch (tableError) {
      // Table doesn't exist, return graceful error
      console.log('Video jobs table not found, returning graceful error');
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          id: job_id,
          status: 'unknown',
          result_url: null,
          error: 'Video processing not available',
          provider_job_id: null,
          updated_at: new Date().toISOString()
        }) 
      };
    }

    if (!data || data.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Job not found' }) };
    }

    return { statusCode: 200, body: JSON.stringify(data[0]) };
  } catch (err) {
    console.error('Video job status error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
