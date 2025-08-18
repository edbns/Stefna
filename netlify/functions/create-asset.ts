import type { Handler } from '@netlify/functions';
import { neonAdmin } from '../lib/neonAdmin';
import type { CreateAssetInput, ApiResult, Asset } from '../lib/types';
import { json } from './_lib/http';

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

  // NO-DB mode: never touch the database; return a fake id so UI can proceed
  if (process.env.NO_DB_MODE === 'true') {
    const fakeId = 'cld-' + ((globalThis as any).crypto?.randomUUID?.() ?? Date.now().toString(36));
    return json({ ok: true, data: { id: fakeId } });
  }

  try {
    const input = JSON.parse(event.body || '{}') as Partial<CreateAssetInput>;

    // Resolve authenticated user
    const userId = getUserIdFromToken(event.headers.authorization);
    if (!userId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const mediaType = (input.mediaType === 'video' || input.mediaType === 'image') ? input.mediaType : 'image';

    console.log('🔍 Creating asset with input:', input);
    console.log('🔍 User ID:', userId);
    console.log('🔍 Media type:', mediaType);
    
    const { data, error } = await neonAdmin
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

    console.log('🔍 Database insert result:', { data, error });

    if (error) {
      console.error('❌ Database insert error:', error);
      return json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      console.error('❌ No data returned from database insert');
      return json({ ok: false, error: 'No data returned from database insert' }, { status: 500 });
    }

    console.log('✅ Asset created successfully:', data);
    return json({ ok: true, data: data as Asset });
  } catch (e: any) {
    return json({ ok: false, error: e.message || 'create-asset error' }, { status: 500 });
  }
};


