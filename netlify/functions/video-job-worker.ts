// /.netlify/functions/video-job-worker.ts
import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';
import { initCloudinary } from './_cloudinary';

const AIML_API_KEY = process.env.AIML_API_KEY!;
const AIML_V2V_ENDPOINT = process.env.AIML_V2V_ENDPOINT || 'https://api.aimlapi.com/v1/video-to-video';
const V2V_WEBHOOK_SECRET = process.env.V2V_WEBHOOK_SECRET || '';

// Story Mode constants
const CLARITY_BOOST_HARD = "maximize micro-contrast and fine detail; razor-sharp edges; crisp textures (hair, neoprene seams, surfboard wax); strictly no halos or oversharpening artifacts; preserve natural skin texture";
const SURFER_POS_LOCK = "same subject, adult male surfer, holding a surfboard, same clothing and gear, same pose and camera angle, same composition on a beach with ocean waves";
const SURFER_NEG_DRIFT = "female, woman, girl, bikini, makeup glam, banana, banana boat, inflatable, kayak, canoe, raft, jetski, paddle, oar, dinghy, extra people, different subject, face swap, body swap";

// Process Story Mode job: generate 4 stills and stitch into MP4
async function processStoryJob(job: any, job_id: string) {
  const cloudinary = initCloudinary();
  const shotFiles: string[] = [];
  
  try {
    // 1) Generate each shot via I2I
    for (let i = 0; i < job.shotlist.length; i++) {
      const shot = job.shotlist[i];
      const shotPrompt = `${job.prompt}. ${shot.add}. ${CLARITY_BOOST_HARD}. ${SURFER_POS_LOCK}`;
      const negativePrompt = `${job.params.negative}, ${SURFER_NEG_DRIFT}`;
      
      console.log(`[Story] Generating shot ${i + 1}/${job.shotlist.length}: ${shot.name}`);
      
      const payload = {
        model: job.model,
        prompt: shotPrompt,
        negative_prompt: negativePrompt,
        image_url: job.source_url,
        strength: job.params.strength,
        num_inference_steps: job.params.steps,
        guidance_scale: job.params.guidance,
        seed: Date.now() + i, // Different seed per shot
      };
      
      const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AIML_API_KEY}` },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Shot ${i + 1} failed: ${response.status} ${await response.text()}`);
      }
      
      const result = await response.json();
      const imageUrl = result?.images?.[0]?.url || result?.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`Shot ${i + 1}: No image URL in response`);
      }
      
      // Download and save temporarily
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const fs = require('fs');
      const path = require('path');
      const tempDir = '/tmp';
      const shotFile = path.join(tempDir, `shot_${i + 1}.jpg`);
      fs.writeFileSync(shotFile, Buffer.from(imageBuffer));
      shotFiles.push(shotFile);
      
      // Update progress
      const progress = Math.round(((i + 1) / job.shotlist.length) * 80); // 80% for generation
      try {
        await sql`
          UPDATE video_jobs 
          SET progress = ${progress}, updated_at = NOW()
          WHERE id = ${job_id}
        `;
      } catch (updateError) {
        console.warn('Failed to update video_jobs progress:', updateError);
      }
    }
    
    // 2) Stitch into MP4 using ffmpeg
    console.log('[Story] Stitching shots into MP4...');
    const { execSync } = require('child_process');
    const outputFile = '/tmp/story.mp4';
    
    // Build ffmpeg command for 4 shots with Ken Burns effect and crossfades
    const duration = 2.6; // seconds per shot
    const fadeDuration = 0.4; // crossfade duration
    
    const ffmpegCmd = `
      ffmpeg -y \\
        -loop 1 -t ${duration} -i ${shotFiles[0]} \\
        -loop 1 -t ${duration} -i ${shotFiles[1]} \\
        -loop 1 -t ${duration} -i ${shotFiles[2]} \\
        -loop 1 -t ${duration} -i ${shotFiles[3]} \\
        -filter_complex "
        [0:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v0];
        [1:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v1];
        [2:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v2];
        [3:v]scale=${job.width}:${job.height},zoompan=z='min(zoom+0.0015,1.08)':d=${Math.round(duration * job.fps)}:s=${job.width}x${job.height}:fps=${job.fps},format=yuv420p[v3];
        [v0][v1]xfade=transition=fade:duration=${fadeDuration}:offset=${duration}[v01];
        [v01][v2]xfade=transition=fade:duration=${fadeDuration}:offset=${duration * 2}[v012];
        [v012][v3]xfade=transition=fade:duration=${fadeDuration}:offset=${duration * 3}[v]
        " -map "[v]" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -movflags +faststart ${outputFile}
    `.replace(/\s+/g, ' ').trim();
    
    execSync(ffmpegCmd, { stdio: 'inherit' });
    
    // 3) Upload to Cloudinary
    console.log('[Story] Uploading MP4 to Cloudinary...');
    const visibilityTag = (job.visibility || 'private') === 'public' ? 'public' : undefined;
    const tags = ['stefna', 'type:story', `user:${job.user_id}`].concat(visibilityTag ? [visibilityTag] : []);
    
    const upload = await (cloudinary as any).uploader.upload(outputFile, {
      resource_type: 'video',
      folder: `stefna/stories/${job.user_id}`,
      tags,
      context: {
        user_id: job.user_id,
        created_at: new Date().toISOString(),
        job_id,
        type: 'story'
      },
      overwrite: true,
      invalidate: true,
    });
    
    if (!upload?.public_id || !upload?.secure_url) {
      throw new Error('Cloudinary upload failed');
    }
    
    // 4) Mark job completed
    try {
      await sql`
        UPDATE video_jobs 
        SET status = 'completed', output_url = ${upload.secure_url}, progress = 100, updated_at = NOW()
        WHERE id = ${job_id}
      `;
    } catch (updateError) {
      console.warn('Failed to update video_jobs completion:', updateError);
    }
    
    // Clean up temp files
    shotFiles.forEach(file => {
      try { require('fs').unlinkSync(file); } catch (e) {}
    });
    try { require('fs').unlinkSync(outputFile); } catch (e) {}
    
    return { statusCode: 200, body: JSON.stringify({ ok: true, job_id, result_url: upload.secure_url, public_id: upload.public_id, type: 'story' }) };
    
  } catch (error: any) {
    console.error('[Story] Error:', error);
    try {
      await sql`
        UPDATE video_jobs 
        SET status = 'failed', error = ${error.message?.slice(0, 2000) || 'failed'}, updated_at = NOW()
        WHERE id = ${job_id}
      `;
    } catch (updateError) {
      console.warn('Failed to update video_jobs error:', updateError);
    }
    
    // Clean up temp files on error
    shotFiles.forEach(file => {
      try { require('fs').unlinkSync(file); } catch (e) {}
    });
    
    return { statusCode: 200, body: JSON.stringify({ ok: false, job_id, error: error.message }) };
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  
  const secret = event.headers['x-internal'];
  if (secret !== '1') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  const { job_id } = JSON.parse(event.body || '{}');
  if (!job_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'job_id required' }) };
  }

  // Try to load job from video_jobs first (for Story Mode), then ai_generations (for V2V)
  let job: any = null;
  let isStoryJob = false;
  
  // First try video_jobs table for Story Mode jobs
  try {
    const storyJob = await sql`
      SELECT id, user_id, source_url, prompt, model, params, shotlist, fps, width, height, allow_remix, visibility, type, status
      FROM video_jobs
      WHERE id = ${job_id}
      LIMIT 1
    `;
    
    if (storyJob && storyJob.length > 0) {
      job = storyJob[0];
      isStoryJob = true;
    }
  } catch (e) {
    // video_jobs table might not exist, continue to ai_generations
    console.log('Video jobs table not found, trying ai_generations');
  }
  
  // If not found in video_jobs, try ai_generations for regular V2V jobs
  if (!job) {
    try {
      const v2vJob = await sql`
        SELECT id, user_id, input_url, preset, visibility, status
        FROM ai_generations
        WHERE id = ${job_id}
        LIMIT 1
      `;
      
      if (!v2vJob || v2vJob.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Job not found' }) };
      }
      job = v2vJob[0];
    } catch (e) {
      console.error('Failed to fetch from ai_generations:', e);
      return { statusCode: 404, body: JSON.stringify({ error: 'Job not found' }) };
    }
  }

  if (job.status !== 'queued') {
    return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Already handled', status: job.status }) };
  }

  // Mark processing in the appropriate table
  try {
    if (isStoryJob) {
      await sql`
        UPDATE video_jobs 
        SET status = 'processing', progress = 1, updated_at = NOW()
        WHERE id = ${job_id}
      `;
    } else {
      await sql`
        UPDATE ai_generations 
        SET status = 'processing', progress = 1, updated_at = NOW()
        WHERE id = ${job_id}
      `;
    }
  } catch (updateError) {
    console.warn('Failed to mark job as processing:', updateError);
  }

  try {
    // Handle Story Mode jobs differently
    if (isStoryJob && job.type === 'story') {
      return await processStoryJob(job, job_id);
    }
    
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
        
        try {
          if (isStoryJob) {
            await sql`UPDATE video_jobs SET status = 'processing', updated_at = NOW() WHERE id = ${job_id}`;
          } else {
            await sql`UPDATE ai_generations SET status = 'processing', updated_at = NOW() WHERE id = ${job_id}`;
          }
        } catch {}
        
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

    // 4) Mark job succeeded in the appropriate table
    try {
      if (isStoryJob) {
        await sql`
          UPDATE video_jobs 
          SET status = 'completed', output_url = ${upload.secure_url}, progress = 100, updated_at = NOW()
          WHERE id = ${job_id}
        `;
      } else {
        await sql`
          UPDATE ai_generations 
          SET status = 'completed', output_url = ${upload.secure_url}, progress = 100, updated_at = NOW()
          WHERE id = ${job_id}
        `;
      }
    } catch (updateError) {
      console.warn('Failed to mark job as completed:', updateError);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, job_id, result_url: upload.secure_url, public_id: upload.public_id }) };
  } catch (e: any) {
    try {
      if (isStoryJob) {
        await sql`
          UPDATE video_jobs 
          SET status = 'failed', error = ${e.message?.slice(0, 2000) || 'failed'}, updated_at = NOW()
          WHERE id = ${job_id}
        `;
      } else {
        await sql`
          UPDATE ai_generations 
          SET status = 'failed', error = ${e.message?.slice(0, 2000) || 'failed'}, updated_at = NOW()
          WHERE id = ${job_id}
        `;
      }
    } catch (updateError) {
      console.warn('Failed to mark job as failed:', updateError);
    }
    
    return { statusCode: 200, body: JSON.stringify({ ok: false, job_id, error: e.message }) };
  }
};
