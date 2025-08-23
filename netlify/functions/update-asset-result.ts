// netlify/functions/update-asset-result.ts
// Updates asset with final generation result (URL, status, etc.)
// Force redeploy - v5 (make assets public and fix feed)

import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from './lib/auth';
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
    // Debug: Log all headers to see what we're receiving
    console.log('[update-asset-result] All headers:', event.headers);
    console.log('[update-asset-result] Authorization header:', event.headers?.authorization);
    console.log('[update-asset-result] Authorization header type:', typeof event.headers?.authorization);
    
    // Authenticate user
    console.log('[update-asset-result] About to call requireAuth...');
    console.log('[update-asset-result] requireAuth function:', typeof requireAuth);
    console.log('[update-asset-result] requireAuth.toString():', requireAuth.toString().substring(0, 200));
    
    const { sub: userId } = requireAuth(event);
    console.log('[update-asset-result] User:', userId);

    const body = JSON.parse(event.body || '{}');
    console.log('[update-asset-result] Request body:', body);

    // 🧠 DEBUG: Special logging for Neo Tokyo Glitch mode
    if (body.meta?.mode === 'neotokyoglitch') {
      console.log('🎭 [update-asset-result] NEO TOKYO GLITCH MODE DETECTED');
      console.log('🎭 [update-asset-result] Meta details:', JSON.stringify(body.meta, null, 2));
      console.log('🎭 [update-asset-result] This should update asset and link to user profile');
    }

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
        is_public = true,
        updated_at = NOW()
      WHERE id = ${assetId} AND user_id = ${userId}
      RETURNING id, final_url, status, is_public, updated_at
    `;

    if (result && result.length > 0) {
      const updatedAsset = result[0];
      console.log('[update-asset-result] Asset updated successfully:', updatedAsset.id);
      
      // 🧠 DEBUG: Confirm Neo Tokyo Glitch asset update
      if (body.meta?.mode === 'neotokyoglitch') {
        console.log('🎭 [update-asset-result] NEO TOKYO GLITCH: Asset successfully updated and linked to user profile');
        console.log('🎭 [update-asset-result] Asset ID:', updatedAsset.id, 'User ID:', userId);
        console.log('🎭 [update-asset-result] Final URL:', updatedAsset.final_url);
        console.log('🎭 [update-asset-result] This should now appear in user profile');
      }
      
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
