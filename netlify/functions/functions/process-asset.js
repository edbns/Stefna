import { neonAdmin } from '../lib/neonAdmin';
import { cloudinary } from '../lib/cloudinary';
// pretend AI call
async function runAIMLTransform(input) {
    // Implement your provider call here and return a buffer or temp file.
    // For now, pretend we got a buffer back:
    return { finalBuffer: Buffer.from('fake-binary') };
}
export const handler = async (event) => {
    try {
        const payload = JSON.parse(event.body || '{}');
        if (!payload.assetId || !payload.sourcePublicId || !payload.mediaType) {
            return resp({ ok: false, error: 'assetId, sourcePublicId, mediaType required' });
        }
        // Mark processing (optional)
        await neonAdmin
            .from('assets')
            .update({ status: 'processing' })
            .eq('id', payload.assetId);
        const result = await runAIMLTransform(payload);
        if (result.error) {
            await neonAdmin.from('assets').update({ status: 'failed' }).eq('id', payload.assetId);
            return resp({ ok: false, error: result.error });
        }
        // Upload to Cloudinary
        const uploadRes = await cloudinary.uploader.upload_stream({ resource_type: payload.mediaType === 'video' ? 'video' : 'image' }, async () => { });
        // Because upload_stream requires piping, provide a helper:
        const finalPublicId = await new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream({ resource_type: payload.mediaType === 'video' ? 'video' : 'image' }, (err, res) => {
                if (err || !res?.public_id)
                    return reject(err || new Error('No Cloudinary response'));
                resolve(res.public_id);
            });
            // write buffer
            if (result.finalBuffer) {
                upload.end(result.finalBuffer);
            }
            else {
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
            return resp({ ok: false, error: updErr.message });
        }
        console.log(`[process-asset] Asset ${payload.assetId} successfully updated to ready status`);
        return resp({ ok: true, data: { assetId: payload.assetId, finalPublicId } });
    }
    catch (e) {
        return resp({ ok: false, error: e.message || 'process-asset error' });
    }
};
function resp(body) {
    return { statusCode: body.ok ? 200 : 400, body: JSON.stringify(body) };
}
