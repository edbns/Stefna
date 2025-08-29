// netlify/functions/verify-otp.ts
import type { Handler } from '@netlify/functions';
import { qOne, q } from './_db';
import { v4 as uuidv4 } from 'uuid';

export const handler: Handler = async (event) => {
  console.log('=== OTP VERIFICATION FUNCTION STARTED ===');
  console.log('Event method:', event.httpMethod);
  console.log('Event body:', event.body);
  
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, code } = JSON.parse(event.body || '{}');
    console.log('Parsed email:', email);
    console.log('Parsed code:', code);

    if (!email || !code) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email and code are required' })
      };
    }

    // Check if OTP exists and is valid using pg
    const otpRecord = await qOne<{ id: string; expires_at: Date; used: boolean }>(
      'SELECT id, expires_at, used FROM auth_otps WHERE email = $1 AND code = $2',
      [email.toLowerCase(), code]
    );

    if (!otpRecord) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid OTP' })
      };
    }

    if (otpRecord.used) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'OTP already used' })
      };
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'OTP expired' })
      };
    }

    // Mark OTP as used
    await q(
      'UPDATE auth_otps SET used = true WHERE id = $1',
      [otpRecord.id]
    );

    // Check if user exists, create if not
    let user = await qOne<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) {
      const userId = uuidv4();
      await q(
        'INSERT INTO users (id, email, created_at) VALUES ($1, $2, NOW())',
        [userId, email.toLowerCase()]
      );
      
      // Create user credits
      await q(
        'INSERT INTO user_credits (user_id, credits, balance) VALUES ($1, 30, 0)',
        [userId]
      );
      
      // Create user settings
      await q(
        'INSERT INTO user_settings (id, user_id, share_to_feed, allow_remix) VALUES ($1, $2, true, true)',
        [uuidv4(), userId]
      );
      
      user = { id: userId, email: email.toLowerCase() };
    }

    console.log('✅ OTP verification successful for user:', user.id);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        userId: user.id,
        email: user.email,
        message: 'OTP verified successfully'
      })
    };

  } catch (error: any) {
    console.error('❌ OTP verification error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
