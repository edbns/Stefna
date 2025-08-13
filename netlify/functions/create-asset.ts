import { Handler } from '@netlify/functions';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import type { CreateAssetInput, ApiResult, Asset } from '../../src/lib/types';

function getUserIdFromToken(auth?: string): string | null {
  try {
    if (!auth?.startsWith('Bearer ')) return null;
    const jwt = auth.slice(7);
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    const id = payload.sub || payload.uid || payload.user_id || payload.userId || payload.id;
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  // NO-DB mode: never touch the database; return a fake id so UI can proceed
  if (process.env.NO_DB_MODE === 'true') {
    const fakeId = 'cld-' + ((globalThis as any).crypto?.randomUUID?.() ?? Date.now().toString(36));
    return { statusCode: 200, body: JSON.stringify({ ok: true, data: { id: fakeId } }) };
  }

  try {
    const input = JSON.parse(event.body || '{}') as Partial<CreateAssetInput>;

    // Resolve authenticated user
    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) return resp({ ok: false, error: 'Unauthorized' });

    const mediaType = (input.mediaType === 'video' || input.mediaType === 'image') ? input.mediaType : 'image';

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert({
        user_id: userId,
        cloudinary_public_id: input.sourcePublicId ?? null,
        media_type: mediaType,
        // compatibility with legacy schemas that still require resource_type
        resource_type: mediaType,
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
