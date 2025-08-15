import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateProfileRequest {
  username?: string;
  avatar_url?: string;
  share_to_feed?: boolean;
  allow_remix?: boolean;
  onboarding_completed?: boolean;
}

// Helper function to verify custom JWT token
function verifyCustomToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    return { userId: decoded.sub || decoded.uid || decoded.user_id || decoded.userId || decoded.id };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get custom JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing or invalid authorization header' })
      };
    }

    const token = authHeader.substring(7);
    
    // Verify custom JWT token (not Supabase Auth)
    const authResult = verifyCustomToken(token);
    if (!authResult) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }

    const userId = authResult.userId;

    // Parse request body
    const body: UpdateProfileRequest = JSON.parse(event.body || '{}');
    console.log('📝 Update profile request:', { userId, body });

    // First, ensure user exists in users table by upserting
    // This prevents the "User ID not found in users table" error
    const { data: userData, error: userUpsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: body.email || `user-${userId}@placeholder.com`, // Placeholder email if not provided
        name: body.username || `User ${userId}`, // Use username or generate name
        tier: 'registered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (userUpsertError) {
      console.error('Failed to upsert user in users table:', userUpsertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to create/update user record',
          details: userUpsertError.message
        })
      };
    }

    console.log('✅ User upserted successfully:', userData);
    
    // Validate username if provided
    if (body.username !== undefined && body.username !== null) {
      if (body.username === '') {
        body.username = null; // Convert empty string to null
      } else {
        // Validate non-empty usernames
        if (body.username.length < 3 || body.username.length > 30) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Username must be 3-30 characters or empty' 
            })
          };
        }
        
        // Check for valid characters (must match database constraint)
        // Updated database constraint: ^[a-zA-Z0-9_-]{3,30}$ with additional rules
        if (!/^[a-zA-Z0-9_-]+$/.test(body.username)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Username can only contain letters, numbers, underscores, and hyphens' 
            })
          };
        }
        
        // Additional validation rules
        if (body.username.startsWith('-')) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Username cannot start with a hyphen' 
            })
          };
        }
        
        if (body.username.includes('---')) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Username cannot contain multiple consecutive hyphens' 
            })
          };
        }

        // Check username uniqueness
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', body.username)
          .neq('id', userId)
          .single();

        if (existingUser && !checkError) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Username already taken' 
            })
          };
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.username !== undefined) updateData.username = body.username;
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;
    if (body.share_to_feed !== undefined) updateData.share_to_feed = body.share_to_feed;
    if (body.allow_remix !== undefined) {
      // Allow remix only if sharing to feed
      updateData.allow_remix = body.share_to_feed ? body.allow_remix : false;
    }
    if (body.onboarding_completed !== undefined) updateData.onboarding_completed = body.onboarding_completed;

    // Upsert profile (create if doesn't exist, update if it does)
    // This references users(id), not auth.users(id)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId, // This must match users.id (UUID from custom auth)
        ...updateData
      })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        userId,
        updateData
      });
      
      // Provide specific error messages
      let errorMessage = 'Failed to update profile';
      if (error.code === 'PGRST116') {
        errorMessage = 'Profile not found and could not be created';
      } else if (error.code === '42P01') {
        errorMessage = 'Profiles table does not exist in database';
      } else if (error.code === '23503') {
        errorMessage = 'User ID not found in users table';
      } else if (error.code === '23505') {
        errorMessage = 'Username already exists';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: errorMessage,
          details: error.details || error.message || 'Database error',
          code: error.code
        })
      };
    }

    // Return updated profile
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        profile: data
      })
    };

  } catch (error) {
    console.error('Update profile error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
