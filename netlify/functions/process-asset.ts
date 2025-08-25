import type { Handler } from '@netlify/functions';
import { neonAdmin } from './_lib/neonAdmin';
import { cloudinary } from './_lib/cloudinary';
import type { ProcessAssetPayload, ApiResult } from '../../src/lib/types';
import { json } from './_lib/http';

// pretend AI call
async function runAIMLTransform(input: ProcessAssetPayload): Promise<{ tempLocalPath?: string; finalBuffer?: Buffer; error?: string }> {
  // Implement your provider call here and return a buffer or temp file.
  // For now, pretend we got a buffer back:
  return { finalBuffer: Buffer.from('fake-binary') };
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}') as ProcessAssetPayload;
    if (!payload.assetId || !payload.sourcePublicId || !payload.mediaType) {
      return json({ ok: false, error: 'assetId, sourcePublicId, mediaType required' }, { status: 400 });
    }

    // Mark processing (optional)
    await neonAdmin
      .from('assets')
      .update({ status: 'processing' })
      .eq('id', payload.assetId);

    const result = await runAIMLTransform(payload);
    if (result.error) {
      await neonAdmin.from('assets').update({ status: 'failed' }).eq('id', payload.assetId);
      return json({ ok: false, error: result.error }, { status: 400 });
    }

    // Upload to Cloudinary
    const uploadRes = await cloudinary.uploader.upload_stream({ resource_type: payload.mediaType === 'video' ? 'video' : 'image' }, async () => {});

    // Because upload_stream requires piping, provide a helper:
    const finalPublicId = await new Promise<string>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: payload.mediaType === 'video' ? 'video' : 'image' },
        (err, res) => {
          if (err || !res?.public_id) return reject(err || new Error('No Cloudinary response'));
          resolve(res.public_id);
        }
      );
      // write buffer
      if (result.finalBuffer) {
        upload.end(result.finalBuffer);
      } else {
        reject(new Error('No AI output buffer'));
      }
    });

    console.log(`[process-asset] Updating asset ${payload.assetId} with:`, {
      status: 'ready',
      cloudinary_public_id: finalPublicId,
      media_type: payload.mediaType
    });

    const { error: updErr } = await neonAdmin
      .from('assets')
      .update({
        status: 'ready',
        cloudinary_public_id: finalPublicId,
        media_type: payload.mediaType, // Ensure media_type is set
      })
      .eq('id', payload.assetId);

    if (updErr) {
      console.error(`[process-asset] DB update failed:`, updErr);
      return json({ ok: false, error: updErr.message }, { status: 500 });
    }

    console.log(`[process-asset] Asset ${payload.assetId} successfully updated to ready status`);

    return json({ ok: true, data: { assetId: payload.assetId, finalPublicId } });
  } catch (e: any) {
    return json({ ok: false, error: e.message || 'process-asset error' }, { status: 500 });
  }
};


