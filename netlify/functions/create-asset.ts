import { Handler } from '@netlify/functions';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import type { CreateAssetInput, ApiResult, Asset } from '../../src/lib/types';

export const handler: Handler = async (event) => {
  try {
    const input = JSON.parse(event.body || '{}') as CreateAssetInput;

    // Basic validation
    if (!input.sourcePublicId || !input.mediaType) {
      return resp({ ok: false, error: 'sourcePublicId and mediaType are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert({
        user_id: getUserIdFromAuth(event), // if you pass auth; else compute on server from session
        cloudinary_public_id: input.sourcePublicId,
        media_type: input.mediaType,
        preset_key: input.presetKey ?? null,
        prompt: input.prompt ?? null,
        source_asset_id: input.sourceAssetId ?? null,
        status: 'queued',
        is_public: false,
        allow_remix: false,
      })
      .select('*')
      .single();

    if (error) return resp({ ok: false, error: error.message });

    return resp({ ok: true, data: data as Asset });
  } catch (e: any) {
    return resp({ ok: false, error: e.message || 'create-asset error' });
  }
};

function resp(body: ApiResult<any>) {
  return { statusCode: body.ok ? 200 : 400, body: JSON.stringify(body) };
}

// Optional: parse user from a JWT if you forward it in headers; otherwise leave null and allow server to set user_id if you have RPC
function getUserIdFromAuth(_event: any): string | null {
  return null;
}
