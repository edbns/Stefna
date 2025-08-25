import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
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
    let claims;
    try {
      claims = jwt.verify(token, jwtSecret, { clockTolerance: 5 });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return resp(401, { error: 'Unauthorized - Invalid token' });
    }

    // Extract user ID from claims
    const uid = claims.sub || claims.user_id || claims.uid || claims.id || claims.userId;
    if (!uid) {
      return resp(401, { error: 'Unauthorized - No user ID in token' });
    }

    const email = claims.email || `user-${uid}@placeholder.com`;

    console.log('🔐 Auth context:', { uid, email, claims });

    // Parse request body
    const body: UpdateProfileRequest = JSON.parse(event.body || '{}');
    console.log('📝 Update profile request:', { uid, body });

    const prisma = new PrismaClient();

    try {
      // FIRST: Ensure user exists in users table by upserting
      // This prevents the "User ID not found in users table" error
      const user = await prisma.user.upsert({
        where: { id: uid },
        update: { 
          email: email || `user-${uid}@placeholder.com`,
          updatedAt: new Date()
        },
        create: {
          id: uid,
          email: email || `user-${uid}@placeholder.com`,
          name: body.username || `User ${uid}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ User upserted successfully');

      // SECOND: Initialize user credits if they don't exist
      try {
        await prisma.userCredits.upsert({
          where: { user_id: uid },
          update: {}, // Don't update if exists
          create: {
            user_id: uid,
            balance: 30,
            updated_at: new Date()
          }
        });
        
        console.log('✅ User credits initialized successfully');
      } catch (creditsError) {
        console.error('Failed to initialize user credits:', creditsError);
        // Don't fail the request for credits errors
      }

      await prisma.$disconnect();

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
      await prisma.$disconnect();
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
