import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { randomUUID } from 'crypto';
import { requireUser } from '../lib/auth';
import { sql } from '../lib/db';

type Variation = {
  image_url: string;
  media_type?: 'image' | 'video';
  prompt?: string;
  cloudinary_public_id?: string;
  source_public_id?: string;
  meta?: Record<string, any>;
};

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const user = await requireUser(event);

    const body = JSON.parse(event.body || '{}');
    const runId: string = body.runId || body.request_id || randomUUID();
    const idempotencyKey: string | undefined = event.headers['x-idempotency-key'] as string | undefined;
    const variations: Variation[] = Array.isArray(body.variations) ? body.variations : [];

    if (!variations.length) {
      return { 
        statusCode: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, message: 'variations[] required' }) 
      };
    }
    if (variations.length > 10) {
      return { 
        statusCode: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, message: 'max 10 variations per request' }) 
      };
    }

    // Create media_batches table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS media_batches (
        batch_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        run_id TEXT,
        idempotency_key TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Add batch_id and run_id columns to media table if they don't exist
    await sql`
      ALTER TABLE media ADD COLUMN IF NOT EXISTS batch_id TEXT
    `;
    await sql`
      ALTER TABLE media ADD COLUMN IF NOT EXISTS run_id TEXT
    `;

    // Add other missing columns with defensive defaults
    await sql`
      ALTER TABLE media ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    `;
    await sql`
      ALTER TABLE media ADD COLUMN IF NOT EXISTS prompt TEXT
    `;
    await sql`
      ALTER TABLE media ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT
    `;
    await sql`
      ALTER TABLE media ADD COLUMN IF NOT EXISTS final_url TEXT
    `;
    await sql`
      ALTER TABLE media ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb
    `;

    // Create index if it doesn't exist
    await sql`
      CREATE INDEX IF NOT EXISTS media_user_run_idx ON media(user_id, run_id)
    `;

    // idempotency: if we've already saved for this run/key, return existing
    if (idempotencyKey) {
      const prev = await sql`
        SELECT m.*
        FROM media m
        JOIN media_batches b ON b.batch_id = m.batch_id
        WHERE b.user_id = ${user.id} AND b.idempotency_key = ${idempotencyKey}
      `;
      if (prev.length) {
        return { 
          statusCode: 200, 
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ ok: true, reused: true, count: prev.length, items: prev }) 
        };
      }
    }

    // filter duplicates we might already have for the same runId+url
    const urls = variations.map(v => v.image_url);
    const dup = await sql`
      SELECT final_url FROM media WHERE user_id = ${user.id} AND run_id = ${runId} AND final_url = ANY(${urls})
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

    // Atomic transaction: batch insert + credit deduction
    const results = await sql.begin(async (tx) => {
      // ensure a batch row (for grouping + idempotency)
      const batchId = randomUUID();
      await tx`
        INSERT INTO media_batches (batch_id, user_id, run_id, idempotency_key, created_at)
        VALUES (${batchId}, ${user.id}, ${runId}, ${idempotencyKey || null}, NOW())
      `;

      // credits: require N credits atomically
      const need = toInsert.length;
      const q = await tx`
        UPDATE credits_ledger 
        SET amount = amount - ${need}
        WHERE user_id = ${user.id} AND amount >= ${need}
        RETURNING amount
      `;
      if (!q.length) throw new Error('Insufficient credits');

      // insert all media rows with defensive defaults
      const items: any[] = [];
      for (const v of toInsert) {
        const id = randomUUID();
        const mediaType = v.media_type || 'image'; // defensive default
        const row = await tx`
          INSERT INTO media (id, batch_id, user_id, run_id,
                             media_type, cloudinary_public_id, final_url,
                             prompt, is_public, source_public_id, meta, created_at)
          VALUES (${id}, ${batchId}, ${user.id}, ${runId},
                  ${mediaType}, ${v.cloudinary_public_id || null}, ${v.image_url},
                  ${v.prompt || null}, true, ${v.source_public_id || null}, ${v.meta || {}}, NOW())
          RETURNING *
        `;
        items.push(row[0]);
      }
      return { batchId, items };
    });

    console.log(`✅ Batch save completed: ${results.items.length} variations for user ${user.id}, run ${runId}`);

    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, count: results.items.length, items: results.items }) 
    };
  } catch (e: any) {
    const code = e?.status || (String(e?.message || '').includes('credits') ? 402 : 500);
    console.error('save-media-batch error', e);
    
    // TEMP: return detailed error for debugging
    return { 
      statusCode: code, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        ok: false, 
        message: String(e?.message || e), 
        stack: e?.stack,               // TEMP: remove after fix
        hint: 'save-media-batch',
        error: String(e?.message || e)
      }) 
    };
  }
};
