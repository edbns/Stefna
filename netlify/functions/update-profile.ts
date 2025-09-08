import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import { requireAuth } from './_lib/auth';

interface UpdateProfileRequest {
  
  
  share_to_feed?: boolean;
  
  onboarding_completed?: boolean;
}

// Helper function to create response
function resp(status: number, body: any) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return resp(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  try {
    // Use standardized authentication helper
    const { userId, platform, permissions } = requireAuth(event.headers.authorization);
    const uid = userId;
    const email = `user-${uid}@placeholder.com`;

    console.log('🔐 Auth context:', { uid, email });

    // Parse request body
    const body: UpdateProfileRequest = JSON.parse(event.body || '{}');
    console.log('📝 Update profile request:', { uid, body });

    

    try {
      // FIRST: Ensure user exists in users table by upserting
      // This prevents the "User ID not found in users table" error
      // Check if user exists
      const existingUser = await qOne(`
        SELECT id FROM users WHERE id = $1
      `, [uid]);
      
      if (existingUser) {
        // Update existing user - only update email if it's provided and not a placeholder
        if (email && !email.includes('@placeholder.com')) {
          await q(`
            UPDATE users 
            SET email = $1, updated_at = NOW()
            WHERE id = $2
          `, [email, uid]);
        }
      } else {
        // DO NOT CREATE NEW USERS HERE!
        // Users should only be created through the proper auth flow (verify-otp)
        console.error('❌ User not found:', uid);
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS'
          },
          body: JSON.stringify({ error: 'User not found. Please sign up first.' })
        };
      }
      
      const user = { id: uid };
      
      console.log('✅ User upserted successfully');

      // SECOND: Initialize user credits if they don't exist
      try {
        // Use raw SQL upsert (ON CONFLICT DO NOTHING)
        await q(`
          INSERT INTO user_credits (user_id, credits, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT (user_id) DO NOTHING
        `, [uid, 30]);

        console.log('✅ User credits initialized successfully');
      } catch (creditsError) {
        console.error('Failed to initialize user credits:', creditsError);
        // Don't fail the request for credits errors
      }

      

      // Return success response
      return resp(200, {
        ok: true,
        message: 'Profile updated successfully',
        user: {
          id: uid,
          email,
          name: null
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      return resp(500, { 
        error: 'Failed to update profile',
        details: String(dbError)
      });
    }

  } catch (error) {
    console.error('Handler error:', error);
    return resp(500, { 
      error: 'Internal server error',
      details: String(error)
    });
  }
}
