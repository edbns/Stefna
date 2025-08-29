// netlify/functions/verify-otp.ts
import type { Handler } from '@netlify/functions';
import { Client as PgClient } from 'pg';
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check database URL
  const url = process.env.DATABASE_URL || '';
  if (!url) {
    console.log('❌ DATABASE_URL missing');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Database configuration error' })
    };
  }

  const client = new PgClient({ connectionString: url });

  try {
    await client.connect();
    console.log('✅ Database connected');

    // Parse request body
    let bodyData;
    try {
      bodyData = JSON.parse(event.body || '{}');
      console.log('✅ Body parsed successfully');
    } catch (parseError) {
      console.log('❌ Failed to parse body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { email, code } = bodyData;
    console.log('Parsed email:', email);
    console.log('Parsed code:', code ? '***' + code.slice(-2) : 'undefined');

    if (!email || !code) {
      console.log('❌ Missing email or code');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email and code are required' })
      };
    }

    // Check if OTP exists and is valid
    console.log('🔍 Checking OTP in database...');
    const otpResult = await client.query(
      'SELECT id, expires_at, used FROM auth_otps WHERE email = $1 AND code = $2',
      [email.toLowerCase(), code]
    );

    console.log('Database query result:', otpResult.rows.length, 'rows found');

    if (otpResult.rows.length === 0) {
      console.log('❌ OTP not found');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid OTP' })
      };
    }

    const otpRecord = otpResult.rows[0];

    if (otpRecord.used) {
      console.log('❌ OTP already used');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'OTP already used' })
      };
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      console.log('❌ OTP expired');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'OTP expired' })
      };
    }

    // Mark OTP as used
    console.log('✅ Marking OTP as used...');
    await client.query(
      'UPDATE auth_otps SET used = true WHERE id = $1',
      [otpRecord.id]
    );

    // Check if user exists, create if not
    console.log('🔍 Checking if user exists...');
    const userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let user;
    if (userResult.rows.length === 0) {
      console.log('👤 Creating new user...');
      const userId = uuidv4();
      await client.query(
        'INSERT INTO users (id, email, created_at) VALUES ($1, $2, NOW())',
        [userId, email.toLowerCase()]
      );

      // Create user credits
      await client.query(
        'INSERT INTO user_credits (user_id, credits, balance) VALUES ($1, 30, 0)',
        [userId]
      );

      // Create user settings
      await client.query(
        'INSERT INTO user_settings (id, user_id, share_to_feed, allow_remix) VALUES ($1, $2, true, true)',
        [uuidv4(), userId]
      );

      user = { id: userId, email: email.toLowerCase() };
    } else {
      user = userResult.rows[0];
    }

    console.log('✅ OTP verification successful for user:', user.id);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  } finally {
    await client.end();
  }
}
