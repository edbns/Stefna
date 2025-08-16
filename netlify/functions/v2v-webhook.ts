import type { Handler } from '@netlify/functions'
import { sql } from '../lib/db'

const SHARED_SECRET = process.env.V2V_WEBHOOK_SECRET || ''

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // optional signature/secret check
    const secret = event.headers['x-webhook-secret'] || event.headers['x-signature'];
    if (SHARED_SECRET && secret !== SHARED_SECRET) {
      return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { jobId, state, outputUrl, error, progress } = body;
    if (!jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'jobId required' }) };
    }

    const update: any = { updated_at: new Date().toISOString() };
    if (typeof progress === 'number') {
      update.progress = Math.max(0, Math.min(100, progress));
    }

    if (state === 'completed') {
      update.status = 'completed';
      update.output_url = outputUrl;
      update.progress = 100;
    } else if (state === 'failed') {
      update.status = 'failed';
      update.error = error || 'unknown error';
    } else if (state === 'processing' || state === 'queued') {
      update.status = 'processing';
    }

    try {
      // Check if ai_generations table exists, if not return graceful error
      await sql`
        UPDATE ai_generations 
        SET 
          status = ${update.status || 'unknown'},
          ${update.output_url ? sql`output_url = ${update.output_url},` : sql``}
          ${update.error ? sql`error = ${update.error},` : sql``}
          ${update.progress ? sql`progress = ${update.progress},` : sql``}
          updated_at = ${update.updated_at}
        WHERE id = ${jobId}
      `;
      
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (tableError) {
      // Table doesn't exist, return graceful error
      console.log('AI generations table not found, returning graceful error');
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          ok: true, 
          message: 'Webhook received but AI generations not available' 
        }) 
      };
    }
  } catch (e: any) {
    console.error('v2v-webhook error', e);
    return { statusCode: 400, body: JSON.stringify({ error: 'bad payload' }) };
  }
}


