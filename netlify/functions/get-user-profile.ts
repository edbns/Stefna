import type { Handler } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { requireAuth } from "./_auth";
import { json } from "./_lib/http";

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
    // Debug: Log all headers to see what's being received
    console.log('🔍 [get-user-profile] Headers received:', {
      allHeaders: event.headers,
      authorization: event.headers?.authorization,
      Authorization: event.headers?.Authorization,
      contentType: event.headers?.['content-type'],
      userAgent: event.headers?.['user-agent']
    });
    
    // Normalize header name (handle both authorization and Authorization)
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    
    if (!authHeader) {
      console.error('❌ [get-user-profile] No Authorization header found');
      return json({ ok: false, error: 'NO_BEARER' }, { status: 401 });
    }
    
    console.log('🔍 [get-user-profile] Auth header found:', {
      headerLength: authHeader.length,
      headerPreview: authHeader.substring(0, 50) + '...',
      startsWithBearer: authHeader.startsWith('Bearer ')
    });
    
    const { userId, email } = requireAuth(authHeader);
    console.log('✅ [get-user-profile] User authenticated:', userId, 'Email:', email);
    
    const prisma = new PrismaClient();

    // Fetch user profile with media assets
    try {
      // Get user info, credits, and media assets
      const [userCredits, appConfig, userMedia, userNeoGlitch] = await Promise.all([
        prisma.userCredits.findUnique({
          where: { user_id: userId },
          select: { balance: true }
        }),
        prisma.appConfig.findUnique({
          where: { key: 'daily_cap' },
          select: { value: true }
        }),
        prisma.mediaAsset.findMany({
          where: { userId: userId },
          select: { id: true, prompt: true, visibility: true, createdAt: true }
        }),
        prisma.neoGlitchMedia.findMany({
          where: { userId: userId },
          select: { id: true, prompt: true, status: true, createdAt: true }
        })
      ]);

      const balance = userCredits?.balance ?? 0;
      const dailyCap = appConfig?.value ? parseInt(appConfig.value as string) : 30;

      await prisma.$disconnect();

      return json({
        ok: true,
        user: { id: userId, email },
        daily_cap: dailyCap,
        credits: { balance },
        media: {
          count: userMedia.length,
          items: userMedia
        },
        neoGlitch: {
          count: userNeoGlitch.length,
          items: userNeoGlitch
        }
      });
    } catch (dbError) {
      console.error('❌ Database error in get-user-profile:', dbError);
      await prisma.$disconnect();
      // Return safe defaults if database fails
      return json({
        ok: true,
        user: { id: userId, email },
        daily_cap: 30,
        credits: { balance: 0 },
      });
    }
  } catch (e: any) {
    console.error('❌ get-user-profile failed:', e);
    console.error('❌ Error details:', {
      message: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : 'No stack trace',
      error: e
    });
    
    // Return 200 with safe defaults instead of 500
    return json({
      ok: false,
      error: 'PROFILE_LOAD_ERROR',
      user: { id: 'unknown', email: 'unknown' },
      daily_cap: 30,
      credits: { balance: 0 },
    });
  }
}

