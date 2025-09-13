import type { Handler } from "@netlify/functions";
import * as jwt from 'jsonwebtoken';
import { json } from './_lib/http';

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405, headers });
  }

  try {
    // Get refresh token from request body
    const { refreshToken } = JSON.parse(event.body || '{}');
    
    if (!refreshToken) {
      return json({ error: 'Refresh token is required' }, { status: 400, headers });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, jwtSecret);
    } catch (error) {
      console.error('Invalid refresh token:', error);
      return json({ error: 'Invalid or expired refresh token' }, { status: 401, headers });
    }

    // Check if it's actually a refresh token
    if (decoded.type !== 'refresh') {
      return json({ error: 'Invalid token type' }, { status: 401, headers });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email,
        platform: decoded.platform,
        permissions: decoded.platform === 'web' ? ['canManageFeed'] : [],
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      jwtSecret
    );

    console.log(`✅ Token refreshed for user ${decoded.userId}`);

    return json({ 
      success: true, 
      accessToken: newAccessToken,
      message: 'Token refreshed successfully'
    }, { headers });

  } catch (error) {
    console.error('Failed to refresh token:', error);
    return json({ error: 'Failed to refresh token' }, { status: 500, headers });
  }
};
