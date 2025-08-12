// /.netlify/functions/video-job-worker.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AIML_API_KEY = process.env.AIML_API_KEY!;
const AIML_V2V_ENDPOINT = process.env.AIML_V2V_ENDPOINT || 'https://api.aimlapi.com/v1/video-to-video';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const secret = event.headers['x-internal'];
  if (secret !== '1') return { statusCode: 403, body: 'Forbidden' };

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { job_id } = JSON.parse(event.body || '{}');
  if (!job_id) return { statusCode: 400, body: 'job_id required' };

  // Load job
  const { data: job, error: jerr } = await supabase.from('video_jobs').select('*').eq('id', job_id).single();
  if (jerr || !job) return { statusCode: 404, body: 'Job not found' };
  if (job.status !== 'queued') return { statusCode: 200, body: 'Already handled' };

  // Mark running
  await supabase.from('video_jobs').update({ status:'running' }).eq('id', job_id);

  try {
    // 1) Submit to provider
    const payload = {
      model: job.model || 'flux/dev/video-to-video',
      prompt: job.prompt,
      video_url: job.source_url,           // provider param
      strength: job.strength ?? 0.85,
      num_inference_steps: job.num_inference_steps ?? 36,
      guidance_scale: job.guidance_scale ?? 7.5,
      seed: job.seed ?? undefined
    };

    const pRes = await fetch(AIML_V2V_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AIML_API_KEY}` },
      body: JSON.stringify(payload)
    });

    if (!pRes.ok) {
      const t = await pRes.text();
      throw new Error(`Provider error ${pRes.status}: ${t}`);
    }

    // Provider may return a long-running job; here we support both:
    const provider = await pRes.json();

    let resultUrl: string | null = null;
    let providerJobId = provider.job_id || provider.id || null;

    // 2) Poll if needed (simple loop; consider exponential backoff)
    if (!provider.result_url && providerJobId) {
      const statusUrl = `${AIML_V2V_ENDPOINT}/${providerJobId}`;
      const started = Date.now();
      while (Date.now() - started < 240000) { // up to 4 minutes
        await new Promise(r => setTimeout(r, 3000));
        const sRes = await fetch(statusUrl, { headers: { Authorization: `Bearer ${AIML_API_KEY}` }});
        const sJson = await sRes.json();
        if (sJson.status === 'succeeded' && sJson.result_url) {
          resultUrl = sJson.result_url;
          break;
        }
        if (sJson.status === 'failed' || sJson.status === 'canceled') {
          throw new Error(`Provider job ${sJson.status}: ${sJson.error || ''}`);
        }
      }
      if (!resultUrl) throw new Error('Timeout waiting for provider result');
    } else {
      resultUrl = provider.result_url || null;
    }

    if (!resultUrl) throw new Error('No result_url from provider');

    // 3) Save media asset (server-side, so client doesn't need to do a second call)
    const { data: asset, error: aerr } = await supabase
      .from('media_assets')
      .insert({
        user_id: job.user_id,
        url: resultUrl,
        source_url: job.source_url,
        resource_type: 'video',
        env: 'prod',
        mode: 'preset',
        prompt: job.prompt,
        model: job.model,
        visibility: job.visibility || 'private',
        allow_remix: job.visibility === 'public' ? !!job.allow_remix : false,
        meta: {
          job_id,
          provider_job_id: providerJobId,
          seed: job.seed,
          fps: job.fps, width: job.width, height: job.height, duration_ms: job.duration_ms
        }
      })
      .select('id')
      .single();

    if (aerr) throw new Error(`save media failed: ${aerr.message}`);

    // 4) Mark job succeeded
    await supabase
      .from('video_jobs')
      .update({ status:'succeeded', result_url: resultUrl, provider_job_id: providerJobId })
      .eq('id', job_id);

    return { statusCode: 200, body: JSON.stringify({ ok:true, job_id, asset_id: asset.id, result_url: resultUrl }) };
  } catch (e:any) {
    await supabase.from('video_jobs').update({ status:'failed', error: e.message?.slice(0, 2000) || 'failed' }).eq('id', job_id);
    return { statusCode: 200, body: JSON.stringify({ ok:false, job_id, error: e.message }) };
  }
};
