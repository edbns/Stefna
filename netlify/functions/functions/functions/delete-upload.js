"use strict";
const { v2: cloudinary } = require('cloudinary');
const { verifyAuth } = require('./_auth');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
exports.handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST')
            return { statusCode: 405, body: 'Method Not Allowed' };
        const { userId } = verifyAuth(event);
        const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
        if (!isUuid(userId))
            return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
        const body = JSON.parse(event.body || '{}');
        const { id, public_id, resource_type = 'image' } = body;
        if (!id)
            return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) };
        // Best-effort Cloudinary delete if we have public_id
        if (public_id && process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                await cloudinary.uploader.destroy(public_id, {
                    resource_type: resource_type === 'video' ? 'video' : 'image',
                    invalidate: true,
                });
                console.log(`Successfully deleted Cloudinary asset: ${public_id}`);
            }
            catch (ce) {
                console.warn('Cloudinary delete failed (continuing):', ce?.message || ce);
            }
        }
        return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Asset deleted successfully' }) };
    }
    catch (e) {
        console.error('delete-upload error:', e);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};
