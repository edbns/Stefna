// netlify/functions/verify-otp.ts
import type { Handler } from '@netlify/functions';
import { Client as PgClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

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

      // Create user settings with PRIVACY-FIRST defaults
      await client.query(
        'INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [userId, false, false] // Privacy first: no upload consent, no public sharing by default
      );

      user = { id: userId, email: email.toLowerCase() };
      
      // Send welcome email for new users (with 5-minute delay)
      try {
        // Use setTimeout to delay the welcome email by 5 minutes
        setTimeout(async () => {
          try {
            await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/sendEmail`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email.toLowerCase(),
                subject: 'Welcome to Stefna',
                text: `Welcome!

Thanks for joining Stefna — where moments turn into masterpieces. You've got 30 free credits today to try our AI transformations.

Need help? Just reply to this email.

Let's create something amazing.

---
Don't want these emails? Unsubscribe here: https://stefna.xyz/unsubscribe?email=${encodeURIComponent(email.toLowerCase())}&type=welcome`,
                type: 'welcome'
              })
            });
            console.log(`📧 Welcome email sent to new user: ${email}`);
          } catch (delayedEmailError) {
            console.warn('⚠️ Failed to send delayed welcome email:', delayedEmailError);
          }
        }, 5 * 60 * 1000); // 5 minutes delay
        
        console.log(`📧 Welcome email scheduled for new user: ${email} (5-minute delay)`);
      } catch (emailError) {
        console.warn('⚠️ Failed to schedule welcome email:', emailError);
        // Don't block user creation if email fails
      }
    } else {
      user = userResult.rows[0];
    }

    console.log('✅ OTP verification successful for user:', user.id);

    // Generate proper JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      jwtSecret
    );

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
        token: token, // Generate a proper JWT token
        user: {
          id: user.id,
          email: user.email
        },
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
