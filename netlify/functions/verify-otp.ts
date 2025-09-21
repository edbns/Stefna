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

    const { email, code, platform: clientPlatform, referrerEmail } = bodyData;
    console.log('Parsed email:', email);
    console.log('Parsed code:', code ? '***' + code.slice(-2) : 'undefined');
    console.log('Parsed referrerEmail:', referrerEmail || 'none');

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

    // Check if OTP exists and is valid for this specific email
    console.log('🔍 Checking OTP in database for email:', email.toLowerCase());
    const otpResult = await client.query(
      'SELECT id, email, expires_at, used, created_at FROM auth_otps WHERE email = $1 AND code = $2',
      [email.toLowerCase(), code]
    );

    console.log('Database query result:', otpResult.rows.length, 'rows found');

    if (otpResult.rows.length === 0) {
      console.log('❌ OTP not found for email:', email.toLowerCase());
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid OTP or email combination' })
      };
    }

    const otpRecord = otpResult.rows[0];
    
    // Additional security: Verify the email matches exactly
    if (otpRecord.email.toLowerCase() !== email.toLowerCase()) {
      console.log('❌ Email mismatch in OTP record:', otpRecord.email, 'vs', email);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid OTP or email combination' })
      };
    }

    if (otpRecord.used) {
      console.log('❌ OTP already used for email:', email.toLowerCase());
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
      console.log('❌ OTP expired for email:', email.toLowerCase());
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
    
    // Additional security: Check if OTP is too old (more than 10 minutes)
    const otpAge = new Date().getTime() - new Date(otpRecord.created_at).getTime();
    const maxAge = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    if (otpAge > maxAge) {
      console.log('❌ OTP too old for email:', email.toLowerCase(), 'Age:', otpAge, 'ms');
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
    
    console.log('✅ OTP validation passed for email:', email.toLowerCase());

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
      
      // Get client IP for abuse prevention
      const forwardedFor = event.headers['x-forwarded-for'] || '';
      const clientIP = forwardedFor.split(',')[0].trim() || 
                      event.headers['x-real-ip'] || 
                      event.headers['x-client-ip'] || 
                      'unknown';
      
      // Check IP-based account creation limit
      const ipLimitCheck = await client.query(
        'SELECT check_ip_account_limit($1) as can_create',
        [clientIP]
      );
      
      if (!ipLimitCheck.rows[0].can_create) {
        console.log('🚫 IP account limit exceeded:', clientIP);
        return {
          statusCode: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            error: 'ACCOUNT_LIMIT_EXCEEDED',
            message: 'Too many accounts created from this IP address. Please try again later.'
          })
        };
      }
      
      const userId = uuidv4();
      await client.query(
        'INSERT INTO users (id, email, created_at) VALUES ($1, $2, NOW())',
        [userId, email.toLowerCase()]
      );

      // Log account creation for IP tracking
      await client.query(
        'INSERT INTO account_creation_log (ip_address, email, created_at) VALUES ($1, $2, NOW())',
        [clientIP, email.toLowerCase()]
      );

      // Get starter grant from app_config
      const starterGrantResult = await client.query(
        'SELECT value FROM app_config WHERE key = $1',
        ['starter_grant']
      );
      console.log('🔍 [Starter Grant] Database result:', starterGrantResult.rows[0]);
      const starterGrant = parseInt(starterGrantResult.rows[0]?.value || '30');
      console.log('💰 [Starter Grant] Final value:', starterGrant);

      // Create user credits with starter grant
      await client.query(
        'INSERT INTO user_credits (user_id, credits, balance) VALUES ($1, $2, 0)',
        [userId, starterGrant]
      );

      // Create user settings with PRIVACY-FIRST defaults
      await client.query(
        'INSERT INTO user_settings (user_id, media_upload_agreed, share_to_feed, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [userId, false, false] // Privacy first: no upload consent, no public sharing by default
      );


      user = { id: userId, email: email.toLowerCase() };
      
      // Process referral if referrerEmail is provided
      if (referrerEmail && referrerEmail.trim()) {
        console.log('🔗 [Referral] Processing referral for new user:', { userId, email, referrerEmail });
        try {
          const referralResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/process-referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrerEmail: referrerEmail.trim(),
              newUserId: userId,
              newUserEmail: email.toLowerCase()
            })
          });
          
          const referralData = await referralResponse.json();
          console.log('🔗 [Referral] Process-referral response:', referralData);
          
          if (referralResponse.ok) {
            console.log('✅ [Referral] Successfully processed:', referralData);
          } else {
            const referralError = await referralResponse.json();
            console.warn('⚠️ [Referral] Failed to process referral:', referralError);
            // Don't fail user creation if referral fails
          }
        } catch (referralError) {
          console.warn('⚠️ [Referral] Error processing referral:', referralError);
          // Don't fail user creation if referral fails
        }
      } else {
        console.log('ℹ️ [Referral] No referrerEmail provided:', referrerEmail);
      }
      
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

Don't want these emails? Unsubscribe.`,
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

    // Generate proper JWT tokens (access + refresh)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Derive platform safely: explicit body value wins; otherwise
    // if origin matches SITE_URL treat as web, else default to mobile
    const hdrOrigin = (event.headers['origin'] || event.headers['Origin'] || '') as string;
    const siteUrl = process.env.SITE_URL || '';
    let platform: 'web' | 'mobile';
    if (clientPlatform === 'web' || clientPlatform === 'mobile') {
      platform = clientPlatform;
    } else if (siteUrl && hdrOrigin && hdrOrigin.includes(siteUrl.replace(/^https?:\/\//, ''))) {
      platform = 'web';
    } else if (hdrOrigin && /stefna\.xyz|netlify\.app|localhost|127\.0\.0\.1/.test(hdrOrigin)) {
      platform = 'web';
    } else {
      platform = 'mobile';
    }
    const permissions = platform === 'web' ? ['canManageFeed'] : [];
    
    // Platform-aware token expiration: 30 days for mobile, 24 hours for web
    const expirationSeconds = platform === 'mobile' 
      ? (30 * 24 * 60 * 60) // 30 days for mobile
      : (24 * 60 * 60);     // 24 hours for web
    
    console.log(`🔐 [Auth] Generating ${platform} token with ${platform === 'mobile' ? '30-day' : '24-hour'} expiration`);
    
    // Generate access token (platform-aware expiration)
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        platform,
        permissions,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expirationSeconds
      },
      jwtSecret
    );

    // Generate refresh token (30 days)
    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        platform,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
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
        accessToken: accessToken,
        refreshToken: refreshToken,
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
