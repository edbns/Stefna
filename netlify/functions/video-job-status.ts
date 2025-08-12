// /.netlify/functions/video-job-status.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };

  const job_id = (event.queryStringParameters || {}).job_id;
  if (!job_id) return { statusCode: 400, body: 'job_id required' };

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: event.headers.authorization || '' } }
  });

  const { data, error } = await supabase
    .from('video_jobs')
    .select('id,status,result_url,error,provider_job_id,updated_at')
    .eq('id', job_id)
    .single();

  if (error) return { statusCode: 404, body: JSON.stringify({ error: error.message }) };
  return { statusCode: 200, body: JSON.stringify(data) };
};
