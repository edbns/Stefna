// netlify/functions/update-asset-result.ts
// Updates asset with final generation result (URL, status, etc.)

import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './_auth';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    // Authenticate user
    const { sub: userId } = requireAuth(event.headers.authorization);
    console.log('[update-asset-result] User:', userId);

    const body = JSON.parse(event.body || '{}');
    console.log('[update-asset-result] Request body:', body);

    const {
      assetId,
      finalUrl,
      status = 'ready',
      prompt,
      meta = {}
    } = body;

    if (!assetId) {
      return json({ ok: false, error: 'MISSING_ASSET_ID' }, { status: 400 });
    }

    if (!finalUrl) {
      return json({ ok: false, error: 'MISSING_FINAL_URL' }, { status: 400 });
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL!);

    // Update the asset with the final result
    const result = await sql`
      UPDATE public.assets 
      SET 
        final_url = ${finalUrl},
        status = ${status},
        prompt = COALESCE(${prompt}, prompt),
        meta = COALESCE(${meta}, meta),
        updated_at = NOW()
      WHERE id = ${assetId} AND user_id = ${userId}
      RETURNING id, final_url, status, updated_at
    `;

    if (result && result.length > 0) {
      const updatedAsset = result[0];
      console.log('[update-asset-result] Asset updated successfully:', updatedAsset.id);
      
      return json({
        ok: true,
        asset: updatedAsset,
        message: 'Asset updated successfully'
      });
    } else {
      console.log('[update-asset-result] Asset not found or access denied:', assetId);
      return json({ ok: false, error: 'ASSET_NOT_FOUND' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('[update-asset-result] Error:', error);
    
    if (error.message === 'NO_BEARER') {
      return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    return json({ 
      ok: false, 
      error: 'UPDATE_FAILED',
      message: error.message 
    }, { status: 500 });
  }
};
