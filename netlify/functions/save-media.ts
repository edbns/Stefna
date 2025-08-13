// netlify/functions/save-media.ts
import { Handler } from '@netlify/functions';
import { initCloudinary, assertCloudinaryEnv } from './_cloudinary';

function inferTypeFromUrl(url: string, hint?: 'image'|'video'): 'image'|'video' {
  if (hint) return hint;
  const u = url.toLowerCase();
  if (u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov')) return 'video';
  return 'image';
}

export const handler: Handler = async (event) => {
  if (process.env.NO_DB_MODE !== 'true') {
    return { statusCode: 412, body: JSON.stringify({ ok:false, error:'NO_DB_MODE=false (DB mode disabled here)' }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok:false, error:'Method not allowed' }) };
  }

  try {
    assertCloudinaryEnv();
    const cloudinary = initCloudinary();

    const { resultUrl, userId, presetKey, sourcePublicId, allowRemix, shareNow, mediaTypeHint } =
      JSON.parse(event.body || '{}');

    if (!resultUrl) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:'MISSING: resultUrl' }) };
    }

    const uid = (userId && String(userId)) || 'anonymous';
    const finalType = inferTypeFromUrl(resultUrl, mediaTypeHint);
    const tags = [
      'stefna',
      'type:output',
      ...(uid !== 'anonymous' ? [`user:${uid}`] : []),
      ...(shareNow ? ['public'] : []),
    ];

    const commonOptions = {
      resource_type: finalType === 'video' ? 'video' : 'image',
      folder: `stefna/outputs/${uid}`,
      tags,
      context: {
        source_public_id: sourcePublicId || '',
        allow_remix: allowRemix ? 'true' : 'false',
        preset_key: presetKey || '',
        created_at: new Date().toISOString(),
      },
      overwrite: true,
      invalidate: true,
    } as const;

    // Try direct URL upload first
    let upload: any;
    try {
      upload = await cloudinary.uploader.upload(resultUrl, commonOptions);
    } catch (directErr: any) {
      console.warn('[save-media] direct upload failed, falling back to stream', directErr?.message || directErr);
      const resp = await fetch(resultUrl);
      if (!resp.ok) {
        const msg = `fetch resultUrl failed: ${resp.status} ${resp.statusText}`;
        console.error('[save-media] ' + msg);
        return { statusCode: 400, body: JSON.stringify({ ok:false, error: msg }) };
      }
      const buf = Buffer.from(await resp.arrayBuffer());
      upload = await new Promise((resolve, reject) => {
        const stream = (initCloudinary() as any).uploader.upload_stream(
          commonOptions,
          (err: any, res: any) => err ? reject(err) : resolve(res)
        );
        stream.end(buf);
      });
    }

    if (!upload?.public_id || !upload?.resource_type) {
      const msg = 'cloudinary upload missing public_id/resource_type';
      console.error('[save-media] ' + msg, { upload });
      return { statusCode: 400, body: JSON.stringify({ ok:false, error: msg }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        data: {
          public_id: upload.public_id,
          resource_type: upload.resource_type,
          url: upload.secure_url,
          created_at: upload.created_at,
          tags: upload.tags,
        }
      })
    };
  } catch (e: any) {
    const msg = e?.message || e?.error?.message || e?.error || 'unknown error';
    const code = e?.code || 'UNKNOWN';
    console.error('[save-media] error', { code, msg, raw:e });
    return { statusCode: 400, body: JSON.stringify({ ok:false, error:`${code}: ${msg}` }) };
  }
};
