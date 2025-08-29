import { Handler } from '@netlify/functions';
import { q, qOne, qCount } from './_db';
import * as jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET!;

interface UpdateProfileRequest {
  username?: string;
  avatar_url?: string;
  share_to_feed?: boolean;
  allow_remix?: boolean;
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
    // Use custom JWT authentication (not Netlify Identity)
    const auth = event.headers.authorization || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    
    if (!token) {
      return resp(401, { error: 'Unauthorized - No bearer token provided' });
    }

    // Verify JWT token
    let claims: jwt.JwtPayload | string;
    try {
      claims = jwt.verify(token, jwtSecret, { clockTolerance: 5 });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return resp(401, { error: 'Unauthorized - Invalid token' });
    }

    // Ensure claims is an object (not a string)
    if (typeof claims === 'string') {
      return resp(401, { error: 'Unauthorized - Invalid token format' });
    }

    // Extract user ID from claims with proper type checking
    const uid = (claims as any).sub ||
                (claims as any).user_id ||
                (claims as any).uid ||
                (claims as any).id ||
                (claims as any).userId;
    if (!uid) {
      return resp(401, { error: 'Unauthorized - No user ID in token' });
    }

    const email = (claims as any).email || `user-${uid}@placeholder.com`;

    console.log('🔐 Auth context:', { uid, email, claims });

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
        // Update existing user
        await q(`
          UPDATE users 
          SET email = $1, updated_at = NOW()
          WHERE id = $2
        `, [email || `user-${uid}@placeholder.com`, uid]);
      } else {
        // Create new user
        await q(`
          INSERT INTO users (id, email, name, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [uid, email || `user-${uid}@placeholder.com`, body.username || `User ${uid}`]);
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
          username: body.username || `User ${uid}`
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
