import type { Handler } from "@netlify/functions";
import { q, qOne, qCount } from './_db';
import { requireAuth } from "./_auth";
import { json } from "./_lib/http";
// No need to import appConfig - we'll read directly from database

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
    
    

    // Fetch user profile with media assets
    try {
      // Get user info, credits, likes, and media assets
      const [userCredits, userLikes, userMedia, userNeoGlitch] = await Promise.all([
        qOne(`
          SELECT credits, balance FROM user_credits WHERE user_id = $1
        `, [userId]),
        qOne(`
          SELECT total_likes_received FROM users WHERE id = $1
        `, [userId]),
        // Get media from all dedicated tables (matching getUserMedia)
        Promise.all([
          q(`
            SELECT id, prompt, status, created_at FROM ghibli_reaction_media WHERE user_id = $1
          `, [userId]),
          q(`
            SELECT id, prompt, status, created_at FROM unreal_reflection_media WHERE user_id = $1
          `, [userId]),
          q(`
            SELECT id, prompt, status, created_at FROM presets_media WHERE user_id = $1
          `, [userId]),
          q(`
            SELECT id, prompt, status, created_at FROM custom_prompt_media WHERE user_id = $1
          `, [userId]),
          q(`
            SELECT id, prompt, status, created_at FROM edit_media WHERE user_id = $1
          `, [userId]),
          q(`
            SELECT id, prompt, status, created_at FROM parallel_self_media WHERE user_id = $1
          `, [userId])
        ]).then(results => results.flat()),
        q(`
          SELECT id, prompt, status, created_at FROM neo_glitch_media WHERE user_id = $1
        `, [userId])
      ]);

      const balance = userCredits?.balance ?? 14; // Use balance (lifetime credits) or default to 14
      
      // Get daily cap directly from database
      const dailyCapResult = await qOne(`SELECT value FROM app_config WHERE key = 'daily_cap'`);
      const dailyCap = parseInt(dailyCapResult?.value || '14');

      

      return json({
        ok: true,
        user: { 
          id: userId, 
          email,
          totalLikesReceived: userLikes?.total_likes_received || 0
        },
        daily_cap: dailyCap,
        credits: { 
          balance,
          daily: userCredits?.credits ?? 14 // Daily spending limit
        },
        media: {
          count: userMedia.length,
          items: userMedia.map(item => ({
            ...item,
            visibility: item.status === 'completed' ? 'public' : 'private'
          }))
        },
        neoGlitch: {
          count: userNeoGlitch.length,
          items: userNeoGlitch
        }
      });
    } catch (dbError) {
      console.error('❌ Database error in get-user-profile:', dbError);
      
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

