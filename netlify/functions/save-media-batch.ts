import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { randomUUID } from 'crypto';
import { sql } from '../lib/db';
import { requireUser } from '../lib/auth';

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    // Authenticate user
    const user = await requireUser(event);
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { variations, runId } = body;
    
    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'variations array is required and must not be empty' 
        })
      };
    }

    if (!runId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          ok: false, 
          error: 'runId is required' 
        })
      };
    }

    // Get idempotency key from header
    const idempotencyKey = event.headers['x-idempotency-key'];
    
    // Check if we've already processed this request
    if (idempotencyKey) {
      const prev = await sql`
        SELECT a.*
        FROM assets a
        WHERE a.user_id = ${user.id} AND a.meta->>'idempotency_key' = ${idempotencyKey}
      `;
      if (prev.length) {
        return { 
          statusCode: 200, 
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ ok: true, reused: true, count: prev.length, items: prev }) 
        };
      }
    }

    // Filter duplicates we might already have for the same runId+url
    const urls = variations.map(v => v.image_url);
    const dup = await sql`
      SELECT final_url FROM assets WHERE user_id = ${user.id} AND meta->>'run_id' = ${runId} AND final_url = ANY(${urls})
    `;
    const dupSet = new Set(dup.map((d: any) => d.final_url));
    const toInsert = variations.filter(v => !dupSet.has(v.image_url));

    if (!toInsert.length) {
      return { 
        statusCode: 200, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, count: 0, items: [], message: 'all were duplicates' }) 
      };
    }

    // Save media items (credits already deducted by frontend)
    try {
      // Ensure a batch row (for grouping + idempotency)
      const batchId = randomUUID();
      await sql`
        INSERT INTO media_batches (batch_id, user_id, run_id, idempotency_key, created_at)
        VALUES (${batchId}, ${user.id}, ${runId}, ${idempotencyKey || null}, NOW())
      `;

      // Insert all media rows with defensive defaults and per-item idempotency
      const items: any[] = [];
      for (const v of toInsert) {
        const id = randomUUID();
        const mediaType = v.media_type || 'image'; // defensive default
        const itemIdempotencyKey = `${runId}:${v.meta?.mood || v.meta?.variation_index || Math.random().toString(36).substr(2, 9)}`;
        
        const row = await sql`
          INSERT INTO assets (id, user_id, cloudinary_public_id, media_type, preset_key, prompt, 
                             source_asset_id, status, is_public, allow_remix, final_url, meta, created_at)
          VALUES (${id}, ${user.id}, ${v.cloudinary_public_id || null}, ${mediaType}, ${v.preset_id || null}, ${v.prompt || null},
                  ${v.source_public_id || null}, 'ready', true, false, ${v.image_url}, 
                  ${JSON.stringify({...v.meta, batch_id: batchId, run_id: runId, idempotency_key: itemIdempotencyKey})}, NOW())
          RETURNING *
        `;
        items.push(row[0]);
      }
      
      const results = { batchId, items };
      console.log(`✅ Batch save completed: ${results.items.length} variations for user ${user.id}, run ${runId}`);
      
      return { 
        statusCode: 200, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, count: results.items.length, items: results.items }) 
      };
      
    } catch (transactionError: any) {
      console.error('❌ Transaction failed:', transactionError);
      throw new Error(`Transaction failed: ${transactionError.message}`);
    }
  } catch (e: any) {
    const code = e?.status || 500;
    console.error('save-media-batch error', e);
    
    return { 
      statusCode: code, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        message: String(e?.message || e), 
        hint: 'save-media-batch - credits should be deducted first',
        error: String(e?.message || e)
      }) 
    };
  }
};
