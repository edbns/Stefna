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
    
    // Validate username if provided (treating as display name, so more lenient)
    if (body.username !== undefined) {
      if (body.username && (body.username.length < 1 || body.username.length > 50)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: 'Name must be 1-50 characters' 
          })
        };
      }

      // Note: Display names don't need to be unique, so no uniqueness check needed
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

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', {
        error,
        userId,
        updateData,
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to update profile',
          details: error.message || 'Database error'
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
