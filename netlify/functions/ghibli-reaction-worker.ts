// netlify/functions/ghibli-reaction-worker.ts
// Background worker to process Ghibli Reaction generations
import { Handler } from '@netlify/functions';
import { q, qOne } from './_db';

export const config = {
  type: 'background'
};

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { jobId, userId, runId, presetKey, sourceUrl } = body;
    const userToken = event.headers.authorization?.replace('Bearer ', '') || '';

    if (!jobId || !userId || !runId || !presetKey || !sourceUrl) {
      console.error('[GhibliWorker] Missing required fields', { jobId, userId, runId, presetKey, hasSource: !!sourceUrl });
      return { statusCode: 200, body: '' };
    }

    // Call centralized fal-generate
    const response = await fetch(`${process.env.URL}/.netlify/functions/fal-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl,
        prompt: `Ghibli reaction: ${presetKey}`,
        generationType: 'ghibli_reaction',
        userId,
        runId
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `fal-generate failed: ${response.status}`);
    }

    const result = await response.json();

    if (result && result.imageUrl) {
      const finalImageUrl = result.imageUrl as string;
      const falJobId = result.falJobId || result.jobId || null;

      if (falJobId) {
        await q(`
          UPDATE ghibli_reaction_media
          SET fal_job_id = $1, updated_at = NOW()
          WHERE id = $2
        `, [falJobId, jobId]);
      }

      await q(`
        UPDATE ghibli_reaction_media
        SET status = $1, image_url = $2, metadata = $3, updated_at = NOW()
        WHERE id = $4
      `, [
        'completed',
        finalImageUrl,
        JSON.stringify({ falJobId, falModel: result.falModel || 'unknown' }),
        jobId
      ]);

      // Finalize credits
      await fetch(`${process.env.URL}/.netlify/functions/credits-finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ userId, requestId: runId, success: true, meta: { presetKey, finalImageUrl: finalImageUrl.substring(0, 100) } })
      });
    } else {
      throw new Error('fal-generate returned no imageUrl');
    }

  } catch (error: any) {
    console.error('❌ [GhibliWorker] Error:', error);
  }

  return { statusCode: 200, body: '' };
};





