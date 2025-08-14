import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing or invalid authorization header' })
      };
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const userId = decoded.userId;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token payload' })
      };
    }

    // Parse request body
    const body: UpdateProfileRequest = JSON.parse(event.body || '{}');
    console.log('📝 Update profile request:', { userId, body });
    console.log('🔧 Environment check:', { 
      supabaseUrl: !!supabaseUrl, 
      supabaseServiceKey: !!supabaseServiceKey,
      jwtSecret: !!jwtSecret 
    });
    
    // Validate username if provided - must match database constraints
    if (body.username !== undefined && body.username !== null) {
      // Allow empty string (will be stored as null)
      if (body.username === '') {
        // Convert empty string to null for database
        body.username = null;
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
        
        // Check for valid characters (alphanumeric, underscore, hyphen)
        if (!/^[a-zA-Z0-9_-]+$/.test(body.username)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Username can only contain letters, numbers, underscores, and hyphens' 
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
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId, // Include the user ID for upsert
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
        updateData,
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update profile';
      if (error.code === 'PGRST116') {
        errorMessage = 'Profile not found and could not be created';
      } else if (error.code === '42P01') {
        errorMessage = 'Profiles table does not exist in database';
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
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
