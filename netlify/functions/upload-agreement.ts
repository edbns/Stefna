import type { Handler } from "@netlify/functions";
import { q } from './_db';
import { json } from './_lib/http';
import { withAuth } from './_withAuth';

export const handler: Handler = withAuth(async (event, user) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('📝 [Upload Agreement] Recording agreement for user:', user.id);

    // Update user's media_upload_agreed setting in database
    await q(`
      INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, created_at, updated_at)
      VALUES ($1, true, false, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        media_upload_agreed = true,
        updated_at = NOW()
    `, [user.id]);
    
    console.log('✅ [Upload Agreement] Agreement saved to database for user:', user.id);
    
    return json({ 
      success: true, 
      message: 'Upload agreement recorded',
      userId: user.id
    });

  } catch (error) {
    console.error('💥 [Upload Agreement] Error:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
});
