import type { Handler } from '@netlify/functions';
import { neonAdmin } from '../lib/neonAdmin';
import type { PublishAssetInput, ApiResult } from '../lib/types';
import { json } from './_lib/http';

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
    const input = JSON.parse(event.body || '{}') as PublishAssetInput;
    if (!input.assetId) return json({ ok: false, error: 'assetId required' }, { status: 400 });

    const { data, error } = await neonAdmin
      .from('assets')
      .update({
        is_public: input.isPublic,
        allow_remix: input.allowRemix,
      })
      .eq('id', input.assetId)
      .select('*')
      .single();

    if (error) return json({ ok: false, error: error.message }, { status: 500 });

    // DB trigger sets published_at when public+ready.
    return json({ ok: true, data });
  } catch (e: any) {
    return json({ ok: false, error: e.message || 'publish-asset error' }, { status: 500 });
  }
};


