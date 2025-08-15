import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    // Use Netlify's built-in authentication
    const authUser = context.clientContext?.user;
    if (!authUser?.sub) {
      return resp(401, { error: 'Unauthorized - No valid user context' });
    }

    const uid = authUser.sub;
    const email = authUser.email || authUser['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

    console.log('🔐 Auth context:', { uid, email, authUser });

    // Parse request body
    const body: UpdateProfileRequest = JSON.parse(event.body || '{}');
    console.log('📝 Update profile request:', { uid, body });

    // FIRST: Ensure user exists in users table by upserting
    // This prevents the "User ID not found in users table" error
    const { data: userData, error: userUpsertError } = await supabase
      .from('users')
      .upsert({
        id: uid,
        email: email || `user-${uid}@placeholder.com`,
        name: body.username || `User ${uid}`,
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
      return resp(500, { 
        error: 'Failed to create/update user record',
        details: userUpsertError.message
      });
    }

    console.log('✅ User upserted successfully:', userData);
    
    // Validate username if provided
    if (body.username !== undefined && body.username !== null) {
      if (body.username === '') {
        body.username = null; // Convert empty string to null
      } else {
        // Validate non-empty usernames
        if (body.username.length < 3 || body.username.length > 30) {
          return resp(400, { 
            error: 'Username must be 3-30 characters or empty' 
          });
        }
        
        // Check for valid characters (must match database constraint)
        if (!/^[a-zA-Z0-9_-]+$/.test(body.username)) {
          return resp(400, { 
            error: 'Username can only contain letters, numbers, underscores, and hyphens' 
          });
        }
        
        // Additional validation rules
        if (body.username.startsWith('-')) {
          return resp(400, { 
            error: 'Username cannot start with a hyphen' 
          });
        }
        
        if (body.username.includes('---')) {
          return resp(400, { 
            error: 'Username cannot contain multiple consecutive hyphens' 
          });
        }

        // Check username uniqueness
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', body.username)
          .neq('id', uid)
          .single();

        if (existingUser && !checkError) {
          return resp(400, { 
            error: 'Username already taken' 
          });
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
        id: uid, // This must match users.id (UUID from Netlify auth)
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
        uid,
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
      
      return resp(500, { 
        error: errorMessage,
        details: error.details || error.message || 'Database error',
        code: error.code
      });
    }

    // Return updated profile
    return resp(200, {
      ok: true,
      profile: data
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return resp(500, { 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
