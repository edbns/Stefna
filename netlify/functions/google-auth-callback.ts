import { Handler } from '@netlify/functions';
import { q } from './_db';
import * as jwt from 'jsonwebtoken';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { code, state } = event.queryStringParameters || {};
    
    if (!code) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authorization code is required' }),
      };
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.URL || 'https://stefna.xyz'}/.netlify/functions/google-auth-callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to exchange authorization code' }),
      };
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('User info fetch failed:', await userResponse.text());
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to fetch user information' }),
      };
    }

    const userInfo = await userResponse.json();
    const { email, name, picture } = userInfo;

    if (!email) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email is required from Google' }),
      };
    }

    // Check if user already exists
    let existingUser = await q('SELECT * FROM users WHERE email = $1', [email]);
    
    let userId: string;
    
    if (existingUser.length > 0) {
      // User exists, update their info
      userId = existingUser[0].id;
      await q(
        'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
        [name || null, userId]
      );
    } else {
      // Create new user
      const newUser = await q(
        'INSERT INTO users (email, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
        [email, name || null]
      );
      userId = newUser[0].id;
      
      // Create user settings with default values
      await q(
        'INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, created_at, updated_at) VALUES ($1, true, false, NOW(), NOW())',
        [userId]
      );
      
      // Create user credits
      await q(
        'INSERT INTO user_credits (user_id, credits, balance, created_at, updated_at) VALUES ($1, 14, 0, NOW(), NOW())',
        [userId]
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    const token = jwt.sign(
      { 
        userId, 
        email, 
        authMethod: 'google',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
      },
      jwtSecret
    );

    // Redirect to frontend with success
    const redirectUrl = `${process.env.URL || 'https://stefna.xyz'}?auth=success&token=${token}`;
    
    return {
      statusCode: 302,
      headers: {
        'Location': redirectUrl,
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };

  } catch (error: any) {
    console.error('Google OAuth error:', error);
    
    // Redirect to frontend with error
    const redirectUrl = `${process.env.URL || 'https://stefna.xyz'}?auth=error&message=${encodeURIComponent(error.message)}`;
    
    return {
      statusCode: 302,
      headers: {
        'Location': redirectUrl,
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  }
};
