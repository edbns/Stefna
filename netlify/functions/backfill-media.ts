import type { Handler } from '@netlify/functions';
import { sql } from '../lib/db';
import { getAuthedUser } from '../lib/auth';
import { v2 as cloudinary } from 'cloudinary';

const MEGA_TAG = process.env.MEGA_COLLECTION_TAG ?? 'collection:mega';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

type Body = {
  userId: string;
  dryRun?: boolean;
  includeFolders?: string[];
  includeTags?: string[];
};

function chunk<T>(arr: T[], n = 100) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

    // Use new auth helper
    const { user, error } = await getAuthedUser(event);
    if (!user || error) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Authentication required' }) };
    }

    const body = JSON.parse(event.body || '{}') as Body;
    const { userId, dryRun = false, includeFolders = [], includeTags = [] } = body;
    
    // Validate userId matches authenticated user
    if (!userId || userId !== user.id) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid userId' }) };
    }

    // 1) Pull all Cloudinary assets for this user (by folder or tag)
    const expressions: string[] = [
      `folder="stefna/outputs/${userId}"`,
      `tags="user:${userId}"`,
      ...includeFolders.map(f => `folder="${f}"`),
      ...includeTags.map(t => `tags="${t}"`),
    ];
    const expression = expressions.join(' OR ');

    let next_cursor: string | undefined = undefined;
    const resources: any[] = [];

    do {
      const res: any = await cloudinary.search
        .expression(expression)
        .with_field('tags')
        .with_field('bytes')
        .with_field('context')
        .with_field('folder')
        .max_results(100)
        .next_cursor(next_cursor)
        .execute();

      resources.push(...(res.resources || []));
      next_cursor = res.next_cursor;
    } while (next_cursor);

    // 2) Get existing user's public_id list to avoid duplicates
    let existingRows;
    try {
      existingRows = await sql`
        SELECT public_id
        FROM media_assets
        WHERE owner_id = ${userId}
      `;
    } catch (exErr) {
      console.error('Failed to fetch existing media:', exErr);
      existingRows = [];
    }

    const existingSet = new Set<string>((existingRows || []).map(r => r.public_id).filter(Boolean));

    // 3) Prepare rows for insert (only missing)
    const rows = resources
      .filter(r => !existingSet.has(r.public_id))
      .map(r => ({
        owner_id: userId,
        public_id: r.public_id as string,
        resource_type: (r.resource_type === 'video' ? 'video' : 'image') as 'image' | 'video',
        url: r.secure_url || r.url,
        visibility: Array.isArray(r.tags) && r.tags.includes('public') ? 'public' : 'private',
        allow_remix: (r.context?.custom?.allow_remix === 'true') || false,
        env: 'production',
        meta: {
          prompt: r.context?.custom?.prompt || null,
          preset_key: r.context?.custom?.preset_key || null,
          source_asset_id: null,
          cloudinary_tags: r.tags || [],
          cloudinary_context: r.context || {},
          bytes: r.bytes,
          folder: r.folder
        },
        created_at: r.created_at as string,
        updated_at: new Date().toISOString(),
      }));

    let inserted = 0;
    if (!dryRun && rows.length) {
      try {
        // Insert rows one by one to handle potential conflicts
        for (const row of rows) {
          await sql`
            INSERT INTO media_assets (
              id, owner_id, public_id, resource_type, url, visibility, 
              allow_remix, env, meta, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), ${row.owner_id}, ${row.public_id}, 
              ${row.resource_type}, ${row.url}, ${row.visibility},
              ${row.allow_remix}, ${row.env}, ${JSON.stringify(row.meta)}, 
              ${row.created_at}, ${row.updated_at}
            )
            ON CONFLICT (public_id) DO NOTHING
          `;
          inserted++;
        }
      } catch (insErr) {
        console.error('Failed to insert rows:', insErr);
        throw insErr;
      }
    }

    // 4) Ensure user and mega tags are attached (optional but useful)
    let retagged = 0;
    if (!dryRun && resources.length) {
      const publicIds = resources.map(r => r.public_id as string);
      const batches = chunk(publicIds, 80);
      for (const ids of batches) {
        try {
          await cloudinary.uploader.add_tag(`user:${userId}`, ids);
          await cloudinary.uploader.add_tag(MEGA_TAG, ids);
          retagged += ids.length;
        } catch (tagErr) {
          console.warn('Failed to add tags to batch:', tagErr);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        userId,
        foundInCloudinary: resources.length,
        inserted,
        retagged,
        dryRun,
        expression,
      }),
    };
  } catch (err: any) {
    console.error('Backfill media error:', err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message, stack: err.stack }) };
  }
};
