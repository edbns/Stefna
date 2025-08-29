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

    // Check if user exists, create if not
    let userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      console.log('👤 [OTP] User not found, creating new user:', email);

      // Create new user
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

      console.log('✅ [OTP] New user created:', userId);
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
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    const resend = new Resend(resendApiKey);
    
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Stefna <hello@stefna.xyz>',
        to: [email],
        subject: `Your Stefna Login Code: ${otp}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefna Login Code</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #000000; 
            color: #ffffff;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #000000; 
            padding: 40px 30px;
            text-align: center;
        }
        .logo { 
            text-align: center; 
            margin-bottom: 40px;
        }
        .logo img {
            height: 60px;
            width: auto;
        }
        .content { 
            line-height: 1.6;
            text-align: center;
        }
        .otp-box { 
            background-color: #1a1a1a; 
            border: 2px solid #333333; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .otp-code { 
            font-size: 36px; 
            font-weight: 700; 
            color: #ffffff; 
            letter-spacing: 4px; 
            font-family: 'Courier New', monospace;
        }
        .expiry { 
            color: #cccccc; 
            font-size: 14px; 
            margin-top: 15px;
        }
        .warning { 
            background-color: #1a1a1a; 
            border: 1px solid #333333; 
            border-radius: 6px; 
            padding: 15px; 
            margin: 20px 0;
            font-size: 14px;
            color: #cccccc;
        }
        .footer { 
            margin-top: 40px; 
            font-size: 12px; 
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://stefna.xyz/logo.png" alt="Stefna" />
        </div>
        
        <div class="content">
            <h1>Your Login Code</h1>
            <p>Use this code to sign in to your Stefna account:</p>
            
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry">Expires in 10 minutes</div>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. Stefna will never ask for it.
            </div>
            
            <p>If you didn't request this code, you can safely ignore this email.</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>&copy; 2024 Stefna. All rights reserved.</p>
        </div>
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
