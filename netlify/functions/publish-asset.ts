import { Handler } from '@netlify/functions';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import type { PublishAssetInput, ApiResult } from '../../src/lib/types';

export const handler: Handler = async (event) => {
  try {
    const input = JSON.parse(event.body || '{}') as PublishAssetInput;
    if (!input.assetId) return resp({ ok: false, error: 'assetId required' });

    const { data, error } = await supabaseAdmin
      .from('assets')
      .update({
        is_public: input.isPublic,
        allow_remix: input.allowRemix,
      })
      .eq('id', input.assetId)
      .select('*')
      .single();

    if (error) return resp({ ok: false, error: error.message });

    // DB trigger sets published_at when public+ready.
    return resp({ ok: true, data });
  } catch (e: any) {
    return resp({ ok: false, error: e.message || 'publish-asset error' });
  }
};

function resp(body: ApiResult<any>) {
  return { statusCode: body.ok ? 200 : 400, body: JSON.stringify(body) };
}
