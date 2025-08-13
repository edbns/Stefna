// /.netlify/functions/video-job-worker.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { initCloudinary } from './_cloudinary';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AIML_API_KEY = process.env.AIML_API_KEY!;
const AIML_V2V_ENDPOINT = process.env.AIML_V2V_ENDPOINT || 'https://api.aimlapi.com/v1/video-to-video';
const V2V_WEBHOOK_SECRET = process.env.V2V_WEBHOOK_SECRET || '';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const secret = event.headers['x-internal'];
  if (secret !== '1') return { statusCode: 403, body: 'Forbidden' };

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { job_id } = JSON.parse(event.body || '{}');
  if (!job_id) return { statusCode: 400, body: 'job_id required' };

  // Load job from ai_generations
  const { data: job, error: jerr } = await supabase
    .from('ai_generations')
    .select('id,user_id,input_url,preset,visibility,status')
    .eq('id', job_id)
    .single();

  if (jerr || !job) return { statusCode: 404, body: 'Job not found' };
  if (job.status !== 'queued') return { statusCode: 200, body: JSON.stringify({ ok:true, message:'Already handled', status: job.status }) };

  // Mark processing
  await supabase.from('ai_generations').update({ status: 'processing', progress: 1 }).eq('id', job_id);

  try {
    // 1) Submit to provider
    const base = process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || '';
    const callbackUrl = base ? `${base}/.netlify/functions/v2v-webhook` : undefined;

    const payload: Record<string, any> = {
      model: 'flux/dev/video-to-video',
      prompt: job.preset || 'stylize',
      video_url: job.input_url,
      strength: 0.85,
      num_inference_steps: 36,
      guidance_scale: 7.5,
    };
    if (callbackUrl) payload.callback_url = callbackUrl;
    if (V2V_WEBHOOK_SECRET) payload.webhook_secret = V2V_WEBHOOK_SECRET;
    // Common pattern for providers to echo back metadata
    payload.metadata = { jobId: job_id };

    const pRes = await fetch(AIML_V2V_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AIML_API_KEY}` },
      body: JSON.stringify(payload)
    });

    if (!pRes.ok) {
      const t = await pRes.text();
      throw new Error(`Provider error ${pRes.status}: ${t}`);
    }

    const provider = await pRes.json();
    let resultUrl: string | null = provider.result_url || null;
    let providerJobId = provider.job_id || provider.id || null;

    // 2) Poll if needed (fallback if provider does not push webhooks)
    if (!resultUrl && providerJobId) {
      const statusUrl = `${AIML_V2V_ENDPOINT}/${providerJobId}`;
      const started = Date.now();
      while (Date.now() - started < 420000) { // up to 7 minutes
        await new Promise(r => setTimeout(r, 3000));
        const sRes = await fetch(statusUrl, { headers: { Authorization: `Bearer ${AIML_API_KEY}` }});
        const sJson = await sRes.json();
        try { await supabase.from('ai_generations').update({ status: 'processing' }).eq('id', job_id); } catch {}
        if ((sJson.status === 'succeeded' || sJson.state === 'completed') && (sJson.result_url || sJson.outputUrl)) {
          resultUrl = sJson.result_url || sJson.outputUrl;
          break;
        }
        if (sJson.status === 'failed' || sJson.status === 'canceled' || sJson.state === 'failed') {
          throw new Error(`Provider job ${sJson.status || sJson.state}: ${sJson.error || ''}`);
        }
      }
    }

    if (!resultUrl) {
      // If webhooks are configured, they will finalize the job; otherwise timeout
      throw new Error('No result_url from provider');
    }

    // 3) Upload result to Cloudinary to power the public feed
    const cloudinary = initCloudinary();
    const visibilityTag = (job.visibility || 'private') === 'public' ? 'public' : undefined;
    const tags = ['stefna', 'type:output', `user:${job.user_id}`].concat(visibilityTag ? [visibilityTag] : []);

    const upload = await (cloudinary as any).uploader.upload(resultUrl, {
      resource_type: 'video',
      folder: `stefna/outputs/${job.user_id}`,
      tags,
      context: {
        user_id: job.user_id,
        created_at: new Date().toISOString(),
        job_id,
        provider_job_id: providerJobId || ''
      },
      overwrite: true,
      invalidate: true,
    });

    if (!upload?.public_id || !upload?.secure_url) {
      throw new Error('Cloudinary upload failed or missing public_id/secure_url');
    }

    // 4) Mark job succeeded in ai_generations
    await supabase
      .from('ai_generations')
      .update({ status: 'completed', output_url: upload.secure_url, progress: 100 })
      .eq('id', job_id);

    return { statusCode: 200, body: JSON.stringify({ ok:true, job_id, result_url: upload.secure_url, public_id: upload.public_id }) };
  } catch (e:any) {
    await supabase.from('ai_generations').update({ status:'failed', error: e.message?.slice(0, 2000) || 'failed' }).eq('id', job_id);
    return { statusCode: 200, body: JSON.stringify({ ok:false, job_id, error: e.message }) };
  }
};
