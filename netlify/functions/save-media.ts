// netlify/functions/save-media.ts
import { Handler } from '@netlify/functions';
import { initCloudinary } from './_cloudinary';

function inferTypeFromUrl(url: string, hint?: 'image'|'video'): 'image'|'video' {
  if (hint) return hint;
  const u = url.toLowerCase();
  if (u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov')) return 'video';
  return 'image';
}

export const handler: Handler = async (event) => {
  if (process.env.NO_DB_MODE === 'true') {
    if (event.httpMethod !== 'POST')
      return { statusCode: 405, body: JSON.stringify({ ok:false, error:'Method not allowed' }) };

    const cloudinary = initCloudinary();

    try {
      const { resultUrl, userId, presetKey, sourcePublicId, allowRemix, shareNow, mediaTypeHint } =
        JSON.parse(event.body || '{}');

      if (!resultUrl || !userId)
        return { statusCode: 400, body: JSON.stringify({ ok:false, error:'resultUrl and userId required' }) };

      const finalType = inferTypeFromUrl(resultUrl, mediaTypeHint);
      const tags = [
        'stefna',
        'type:output',
        `user:${userId}`,
        ...(presetKey ? [`preset:${presetKey}`] : []),
        ...(shareNow ? ['public'] : []),
      ];

      const upload = await cloudinary.uploader.upload(resultUrl, {
        resource_type: finalType === 'video' ? 'video' : 'image',
        folder: `stefna/outputs/${userId}`,
        tags,
        context: {
          source_public_id: sourcePublicId || '',
          allow_remix: allowRemix ? 'true' : 'false',
          preset_key: presetKey || '',
      created_at: new Date().toISOString(),
        },
        overwrite: true,
        invalidate: true,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            public_id: upload.public_id,
            resource_type: upload.resource_type,
            url: upload.secure_url,
            created_at: upload.created_at,
          }
        })
      };
    } catch (e: any) {
      console.error('[save-media] error', e);
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: e?.message || 'unknown error' }) };
    }
  }

  // fallback to DB mode (existing behavior)
  // existing DB handler code remains in other branch/commit; returning Precondition Failed here
  return { statusCode: 412, body: JSON.stringify({ ok:false, error:'NO_DB_MODE=false' }) };
};
