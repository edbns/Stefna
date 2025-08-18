import { neonAdmin } from '../lib/neonAdmin';
export const handler = async (event) => {
    try {
        const input = JSON.parse(event.body || '{}');
        if (!input.assetId)
            return resp({ ok: false, error: 'assetId required' });
        const { data, error } = await neonAdmin
            .from('assets')
            .update({
            is_public: input.isPublic,
            allow_remix: input.allowRemix,
        })
            .eq('id', input.assetId)
            .select('*')
            .single();
        if (error)
            return resp({ ok: false, error: error.message });
        // DB trigger sets published_at when public+ready.
        return resp({ ok: true, data });
    }
    catch (e) {
        return resp({ ok: false, error: e.message || 'publish-asset error' });
    }
};
function resp(body) {
    return { statusCode: body.ok ? 200 : 400, body: JSON.stringify(body) };
}
