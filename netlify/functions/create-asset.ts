import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import type { CreateAssetInput, ApiResult, Asset, MediaType } from '../../src/lib/types';
import { json } from './_lib/http';

// Initialize Prisma client
const prisma = new PrismaClient();

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
  // 🧾 TEMPORARY DEBUG: Log the received request
  console.log('🧾 Received body:', event.body);
  console.log('🔐 Headers:', Object.keys(event.headers || {}));
  
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
    
    // Use Prisma instead of raw SQL
    console.log('🔍 Executing Prisma create with parameters:', {
      userId,
      sourcePublicId: input.sourcePublicId ?? null,
      mediaType,
      presetKey: input.presetKey ?? null,
      prompt: input.prompt ?? null,
      sourceAssetId: input.sourceAssetId ?? null
    });
    
    console.log('🔍 About to execute Prisma create...');
    
    let data, error;
    
    try {
      const result = await prisma.mediaAsset.create({
        data: {
          userId,
          url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${input.sourcePublicId}`, // Construct URL from Cloudinary public ID
          publicId: input.sourcePublicId ?? null, // Map to publicId field
          resourceType: mediaType, // Map to resourceType field
          cloudinaryPublicId: input.sourcePublicId ?? null,
          mediaType,
          presetKey: input.presetKey ?? null,
          prompt: input.prompt ?? null,
          sourceAssetId: input.sourceAssetId ?? null,
          status: 'queued',
          allowRemix: false,
          visibility: 'public' // Set visibility to public so it appears in feed
        }
      });
      
      console.log('🔍 Prisma create completed, result:', result);
      data = result;
      error = null;
    } catch (prismaError) {
      console.error('❌ Prisma create failed:', prismaError);
      return json({ ok: false, error: `Database insert failed: ${prismaError instanceof Error ? prismaError.message : 'Unknown error'}` }, { status: 500 });
    }

    console.log('🔍 Database insert result:', { data, error });
    console.log('🧪 Insert result details:', {
      hasData: !!data,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : 'N/A',
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      errorType: typeof error,
      errorMessage: error?.message || 'N/A'
    });

    if (error) {
      console.error('❌ Database insert error:', error);
      return json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }

    if (!data) {
      console.error('❌ No data returned from database insert');
      return json({ ok: false, error: 'No data returned from database insert' }, { status: 500 });
    }

    console.log('✅ Asset created successfully:', data);
    
    // 🧠 DEBUG: Log user linking information for Neo Tokyo Glitch debugging
    console.log('🧠 [create-asset] Final save: asset_id =', data.id, 'user_id =', userId || 'null');
    console.log('🧠 [create-asset] Asset details:', {
      id: data.id,
      userId: userId,
      mediaType: mediaType,
      presetKey: input.presetKey,
      prompt: input.prompt ? input.prompt.substring(0, 100) + '...' : null,
      timestamp: new Date().toISOString()
    });
    
    // Map Prisma result to Asset type
    const assetData: Asset = {
      id: data.id,
      user_id: data.userId,
      cloudinary_public_id: data.cloudinaryPublicId,
      media_type: data.mediaType as MediaType,
      status: data.status as 'queued' | 'processing' | 'ready' | 'failed',
      is_public: false,
      published_at: null,
      source_asset_id: data.sourceAssetId,
      preset_key: data.presetKey,
      prompt: data.prompt,
      created_at: data.createdAt.toISOString()
    };
    
    return json({ ok: true, data: assetData });
  } catch (e: any) {
    return json({ ok: false, error: e.message || 'create-asset error' }, { status: 500 });
  }
};


