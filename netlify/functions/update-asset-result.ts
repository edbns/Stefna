// netlify/functions/update-asset-result.ts
// Updates asset with final generation result (URL, status, etc.)
// Uses Prisma for consistent database access

import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './_lib/auth';
import { json } from './_lib/http';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const { userId } = requireAuth(authHeader);
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

    // Update the asset with the final result using Prisma
    const updatedAsset = await prisma.mediaAsset.update({
      where: {
        id: assetId,
        userId: userId
      },
      data: {
        finalUrl: finalUrl,
        status: status,
        prompt: prompt || undefined,
        meta: meta,
        isPublic: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        finalUrl: true,
        status: true,
        isPublic: true,
        updatedAt: true
      }
    });

    if (updatedAsset) {
      console.log('[update-asset-result] Asset updated successfully:', updatedAsset.id);
      
      // 🧠 DEBUG: Confirm Neo Tokyo Glitch asset update
      if (body.meta?.mode === 'neotokyoglitch') {
        console.log('🎭 [update-asset-result] NEO TOKYO GLITCH: Asset successfully updated and linked to user profile');
        console.log('🎭 [update-asset-result] Asset ID:', updatedAsset.id, 'User ID:', userId);
        console.log('🎭 [update-asset-result] Final URL:', updatedAsset.finalUrl);
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
  } finally {
    await prisma.$disconnect();
  }
};
