// netlify/functions/save-media.ts
import { Handler } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

// ✅ service-role client (NOT anon)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// tiny helper
function inferTypeFromUrl(url: string, hint?: string): 'image'|'video' {
  if (hint === 'video' || hint === 'image') return hint;
  const u = url.toLowerCase();
  if (u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov')) return 'video';
  return 'image';
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
    }

    const body = JSON.parse(event.body || '{}') as {
      assetId?: string;
      resultUrl?: string;
      mediaTypeHint?: 'image'|'video';
      folder?: string; // optional: e.g., 'stefna/outputs'
    };

    if (!body.assetId || !body.resultUrl) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'assetId and resultUrl are required' }) };
    }

    const resourceType = inferTypeFromUrl(body.resultUrl, body.mediaTypeHint);

    // 1) Upload RESULT to Cloudinary (remote URL → Cloudinary)
    let upload;
    try {
      upload = await cloudinary.uploader.upload(body.resultUrl, {
        resource_type: resourceType,
        folder: body.folder || 'stefna/outputs',
        overwrite: true,
        invalidate: true,
      });
    } catch (e: any) {
      console.error('[save-media] Cloudinary upload failed', { assetId: body.assetId, err: e?.message });
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: `cloudinary: ${e?.message || 'upload failed'}` }) };
    }

    if (!upload?.public_id || !upload?.resource_type) {
      console.error('[save-media] Cloudinary response missing fields', { upload });
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'cloudinary: missing public_id' }) };
    }

    const finalPublicId = upload.public_id;
    const finalType: 'image'|'video' = upload.resource_type === 'video' ? 'video' : 'image';

    // 2) Update SAME assets row with OUTPUT + ready
    const { error: updErr, data: updRow } = await supabase
      .from('assets')
      .update({
        status: 'ready',
        cloudinary_public_id: finalPublicId,
        media_type: finalType,
      })
      .eq('id', body.assetId)
      .select('id') // prove it updated
      .single();

    if (updErr) {
      console.error('[save-media] DB update failed', { assetId: body.assetId, updErr });
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: `db: ${updErr.message}` }) };
    }
    if (!updRow) {
      console.error('[save-media] DB update affected 0 rows', { assetId: body.assetId });
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'db: no row updated' }) };
    }

    // 3) Return success
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        data: {
          assetId: body.assetId,
          publicId: finalPublicId,
          mediaType: finalType,
        },
      }),
    };
  } catch (e: any) {
    console.error('[save-media] unhandled', e);
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: e?.message || 'unknown error' }) };
  }
};
