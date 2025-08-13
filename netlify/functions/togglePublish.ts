import { Handler } from '@netlify/functions';
import { initCloudinary } from './_cloudinary';

export const handler: Handler = async (event) => {
  if (process.env.NO_DB_MODE !== 'true')
    return { statusCode: 412, body: JSON.stringify({ ok:false, error:'NO_DB_MODE=false' }) };

  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: JSON.stringify({ ok:false, error:'Method not allowed' }) };

  const cloudinary = initCloudinary();

  try {
    const { publicId, publish } = JSON.parse(event.body || '{}');
    if (!publicId) return { statusCode: 400, body: JSON.stringify({ ok:false, error:'publicId required' }) };

    if (publish) await cloudinary.api.add_tag('public', [publicId]);
    else         await cloudinary.api.remove_tag('public', [publicId]);

    return { statusCode: 200, body: JSON.stringify({ ok:true }) };
  } catch (e: any) {
    console.error('[togglePublish] error', e);
    return { statusCode: 400, body: JSON.stringify({ ok:false, error: e?.message || 'unknown error' }) };
  }
};
