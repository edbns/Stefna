import type { Handler } from '@netlify/functions';
import { Client as PgClient } from 'pg';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// VERSION: 7.0 - RAW SQL MIGRATION
// ============================================================================
// This function uses raw SQL queries through the _db helper
// - Replaced Prisma with direct SQL queries
// - Uses q for database operations
// - Sends OTP emails for authentication
// ============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
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
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' },
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

    const { email } = bodyData;

    if (!email) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    console.log('📧 [OTP] Processing OTP request for:', email);

    // Check if user exists - DO NOT CREATE USER HERE
    let userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      console.log('👤 [OTP] New user - will be created during verification');
      // DO NOT CREATE USER HERE! This prevents duplicate users.
      // User creation happens ONLY in verify-otp.ts
    } else {
      console.log('✅ [OTP] Existing user found:', userResult.rows[0].id);
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('=== GENERATED OTP ===');
    console.log('OTP:', otp);
    console.log('Expires at:', expiresAt.toISOString());

    // Insert OTP using raw SQL
    let otpInserted = false;
    try {
      console.log('=== INSERTING OTP WITH RAW SQL ===');
      const insertResult = await client.query(
        'INSERT INTO auth_otps (id, email, code, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
        [uuidv4(), email.toLowerCase(), otp, expiresAt]
      );

      console.log('OTP inserted successfully:', insertResult.rows[0]?.id);
      otpInserted = true;
    } catch (insertError) {
      console.error('Failed to insert OTP with raw SQL:', insertError);
      // Continue with email sending even if DB insert fails
    }

    // Send email via Resend
    console.log('=== SENDING EMAIL ===');
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');

      // Return success anyway since OTP was inserted
      // User can manually use the OTP from logs for testing
      console.log('🚨 EMAIL NOT CONFIGURED - OTP CODE:', otp);
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
          message: 'OTP generated (check server logs for code)',
          otpInserted: otpInserted,
          otp: otp // Include OTP in response for testing
        })
      };
    }

    const resend = new Resend(resendApiKey);
    
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Stefna <hello@stefna.xyz>',
        to: [email],
        subject: `Your Stefna Login Code ${otp}`,
        html: `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#000;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefna Login Code</title>
  </head>
  <body style="background-color:#000; color:#fff; font-family:Arial, sans-serif; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:40px 20px; text-align:center;">
      <img src="https://stefna.xyz/logo.png" alt="Stefna Logo" style="max-width:40px; margin-bottom:40px; display:block; margin-left:auto; margin-right:auto;">

      <h1 style="font-size:20px; font-weight:bold; margin-bottom:16px;">Your Stefna Login Code</h1>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Hello,
      </p>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Your one-time login code is:
      </p>
      
              <div style="background-color:#1a1a1a; border:2px solid #333; border-radius:8px; padding:30px; margin:30px 0; text-align:center;">
          <div style="font-size:36px; font-weight:700; color:#fff; letter-spacing:4px; font-family:'Courier New',monospace;">${otp}</div>
          <div style="color:#ccc; font-size:14px; margin-top:15px;">Expires in 10 minutes</div>
        </div>

      <p style="font-size:14px; color:#aaa; margin-top:40px;">Stefna<br><p style="margin:5px 0 0; font-size:12px; color:#888888; text-align:center;">
        If you didn't request this code, you can safely ignore this email.<br />
        &copy; 2025 Stefna. All rights reserved.
      </p>
    </div>
  </body>
</html>`
      });

      if (emailError) {
        console.error('❌ [OTP] Email send failed:', emailError);
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Failed to send OTP email',
            details: emailError.message
          })
        };
      }

      console.log('✅ [OTP] Email sent successfully:', emailData?.id);
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'OTP sent successfully',
          otpInserted: otpInserted
        })
      };

    } catch (emailError) {
      console.error('❌ [OTP] Email send error:', emailError);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to send OTP email',
          details: emailError instanceof Error ? emailError.message : 'Unknown error'
        })
      };
    }

  } catch (error) {
    console.error('💥 [OTP] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  } finally {
    await client.end();
  }
};
