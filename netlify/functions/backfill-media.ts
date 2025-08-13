import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MEGA_TAG = process.env.MEGA_COLLECTION_TAG ?? 'collection:mega';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = JSON.parse(event.body || '{}') as Body;
    const { userId, dryRun = false, includeFolders = [], includeTags = [] } = body;
    if (!userId) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'userId required' }) };

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

    // 2) Get existing user's cloudinary_public_id list to avoid duplicates
    const { data: existingRows, error: exErr } = await supabase
      .from('assets')
      .select('cloudinary_public_id')
      .eq('user_id', userId);
    if (exErr) throw exErr;

    const existingSet = new Set<string>((existingRows || []).map(r => r.cloudinary_public_id).filter(Boolean));

    // 3) Prepare rows for insert (only missing)
    const rows = resources
      .filter(r => !existingSet.has(r.public_id))
      .map(r => ({
        user_id: userId,
        cloudinary_public_id: r.public_id as string,
        media_type: (r.resource_type === 'video' ? 'video' : 'image') as 'image' | 'video',
        status: 'ready' as const,
        is_public: Array.isArray(r.tags) ? r.tags.includes('public') : false,
        allow_remix: (r.context?.custom?.allow_remix === 'true') || false,
        published_at: Array.isArray(r.tags) && r.tags.includes('public') ? (r.created_at as string) : null,
        source_asset_id: null,
        preset_key: r.context?.custom?.preset_key || null,
        prompt: null,
        created_at: r.created_at as string,
        updated_at: new Date().toISOString(),
      }));

    let inserted = 0;
    if (!dryRun && rows.length) {
      const { error: insErr } = await supabase.from('assets').insert(rows);
      if (insErr) throw insErr;
      inserted = rows.length;
    }

    // 4) Ensure user and mega tags are attached (optional but useful)
    let retagged = 0;
    if (!dryRun && resources.length) {
      const publicIds = resources.map(r => r.public_id as string);
      const batches = chunk(publicIds, 80);
      for (const ids of batches) {
        await cloudinary.uploader.add_tag(`user:${userId}`, ids);
        await cloudinary.uploader.add_tag(MEGA_TAG, ids);
        retagged += ids.length;
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
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message, stack: err.stack }) };
  }
};
