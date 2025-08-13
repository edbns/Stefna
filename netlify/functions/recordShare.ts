// netlify/functions/recordShare.ts
import type { Handler } from '@netlify/functions';
import { initCloudinary, assertCloudinaryEnv } from './_cloudinary';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null as any;

function getUserIdFromToken(auth?: string): string | null {
  try {
    if (!auth?.startsWith('Bearer ')) return null;
    const jwt = auth.slice(7);
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    const id = payload.sub || payload.uid || payload.user_id || payload.userId || payload.id;
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

async function resolvePublicIdByAssetId(cloudinary: any, assetId: string): Promise<string | null> {
  const expr = `tags=\"stefna\" AND context.asset_id=\"${assetId}\"`;
  const maxAttempts = 6;
  const delayMs = 300;
  for (let i = 0; i < maxAttempts; i++) {
    const found = await cloudinary.search.expression(expr).max_results(1).execute();
    const pid = found?.resources?.[0]?.public_id as string | undefined;
    if (pid) return pid;
    await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok:false, error: 'Method not allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');

    // Cloudinary-only path
    if (process.env.NO_DB_MODE === 'true') {
      let publicId: string | undefined = body.publicId as string | undefined;
      const allowRemix: boolean = !!body.allowRemix;
      const assetId: string | undefined = (body.assetId || body.asset_id) as string | undefined;
      if (!publicId && !assetId) {
        return { statusCode: 400, body: JSON.stringify({ ok:false, error:'MISSING: publicId (or assetId)' }) };
      }
      try {
        assertCloudinaryEnv();
        const cloudinary = initCloudinary();
        // Resolve from assetId using context if needed, with retry (indexing delay)
        if (!publicId && assetId) {
          publicId = await resolvePublicIdByAssetId(cloudinary, assetId);
          if (!publicId) {
            return { statusCode: 404, body: JSON.stringify({ ok:false, error:`No Cloudinary asset found for assetId ${assetId}` }) };
          }
        }
        // ensure base tags & publish tag
        await cloudinary.api.add_tag('stefna', [publicId!]);
        await cloudinary.api.add_tag('type:output', [publicId!]);
        await cloudinary.api.add_tag('public', [publicId!]);
        await cloudinary.uploader.explicit(publicId!, {
          type: 'upload',
          context: { allow_remix: allowRemix ? 'true' : 'false', published_at: new Date().toISOString() },
        });
        return { statusCode: 200, body: JSON.stringify({ ok:true }) };
      } catch (e:any) {
        const msg = e?.message || 'unknown error';
        console.error('[recordShare] cloudinary error', msg);
        return { statusCode: 400, body: JSON.stringify({ ok:false, error: msg }) };
      }
    }

    // DB MODE (legacy)
    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ ok:false, error: 'Unauthorized' }) };
    }

    const { asset_id, shareToFeed, allowRemix } = body;
    if (!asset_id) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: 'asset_id required' }) };
    }

    const is_public = !!shareToFeed;
    const allow_remix = !!shareToFeed && !!allowRemix;

    const { data, error } = await (supabase as any)
      .from('assets')
      .update({ is_public, allow_remix })
      .eq('id', asset_id)
      .eq('user_id', userId)
      .select('id, is_public, allow_remix, published_at')
      .single();

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok:true, asset: data }) };
  } catch (e: any) {
    const msg = e?.message || 'unknown error';
    console.error('recordShare error:', msg);
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: msg }) };
  }
};


