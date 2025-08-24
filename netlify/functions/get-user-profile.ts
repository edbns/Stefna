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
    if (!event.headers?.authorization && !event.headers?.Authorization) {
      return json({ ok: false, error: 'NO_BEARER' }, { status: 401 });
    }
    
    const { sub: userId, email } = requireAuth(event.headers.authorization);
    console.log('[get-user-profile] User:', userId, 'Email:', email);
    
    const prisma = new PrismaClient();

    // Simple profile fetch - no complex table operations
    try {
      // Just get basic user info and credits
      const [userCredits, appConfig] = await Promise.all([
        prisma.userCredits.findUnique({
          where: { user_id: userId },
          select: { balance: true }
        }),
        prisma.appConfig.findUnique({
          where: { key: 'daily_cap' },
          select: { value: true }
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

