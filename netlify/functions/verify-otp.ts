import type { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { Resend } from 'resend';

export const handler: Handler = async (event) => {
  console.log('=== VERIFY OTP FUNCTION STARTED ===');
  
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }
  
  try {
    if (event.httpMethod !== 'POST') {
      return { 
        statusCode: 405, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }
    
    const { email, otp, referrerEmail } = JSON.parse(event.body || '{}');
    console.log('Input:', { email, otp, referrerEmail });
    if (!email || !otp) {
      return { 
        statusCode: 400, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email and OTP required' })
      };
    }

    // Connect to Neon database
    const databaseUrl = process.env.NETLIFY_DATABASE_URL;
    if (!databaseUrl) {
      console.error('Missing Neon database environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Database configuration error' })
      };
    }
    
    console.log('=== CREATING NEON CLIENT ===');
    const sql = neon(databaseUrl);
    console.log('Neon client:', sql ? 'CREATED' : 'FAILED TO CREATE');

    // 1) Verify OTP exists, not used, and not expired
    const now = new Date().toISOString();
    console.log('Looking up OTP for email:', email, 'code:', otp, 'at time:', now);
    
    const otpRows = await sql`
      SELECT * FROM auth_otps 
      WHERE email = ${email.toLowerCase()} 
        AND code = ${otp} 
        AND used = false 
        AND expires_at > ${now}
    `;
    
    console.log('OTP lookup result:', otpRows);

    if (!otpRows || otpRows.length === 0) {
      console.log('Invalid or expired OTP');
      return { 
        statusCode: 401, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid or expired OTP' })
      };
    }

    // 2) Mark OTP as used
    const otpId = otpRows[0].id;
    console.log('Marking OTP as used:', otpId);
    
    await sql`
      UPDATE auth_otps 
      SET used = true 
      WHERE id = ${otpId}
    `;
    
    // 3) Check if user exists
    const userRows = await sql`
      SELECT * FROM users 
      WHERE email = ${email.toLowerCase()}
    `;
    
    let userId: string;
    let isNewUser = false;
    
    if (userRows && userRows.length > 0) {
      // User exists
      userId = userRows[0].id;
      console.log('Existing user found:', userId);
    } else {
      // Create new user
      isNewUser = true;
      userId = uuidv4();
      console.log('Creating new user with ID:', userId);
      
      await sql`
        INSERT INTO users (id, email, external_id, created_at)
        VALUES (${userId}, ${email.toLowerCase()}, ${email.toLowerCase()}, ${now})
      `;
      
      // Initialize user credits
      const starterGrantRows = await sql`
        SELECT value FROM app_config WHERE key = 'starter_grant'
      `;
      const starterAmount = starterGrantRows[0]?.value ? parseInt(starterGrantRows[0].value) : 30;
      
      await sql`
        INSERT INTO user_credits (user_id, balance, updated_at)
        VALUES (${userId}, ${starterAmount}, ${now})
      `;
      
      await sql`
        INSERT INTO credits_ledger (user_id, request_id, action, amount, status, meta, created_at)
        VALUES (${userId}, ${uuidv4()}, 'starter_grant', ${starterAmount}, 'granted', '{"reason": "starter"}', ${now})
      `;
      
      console.log(`New user created with ${starterAmount} starter credits`);
      
      // Process referral if provided
      if (referrerEmail) {
        try {
          const referrerRows = await sql`
            SELECT id FROM users WHERE email = ${referrerEmail.toLowerCase()}
          `;
          
          if (referrerRows && referrerRows.length > 0) {
            const referrerId = referrerRows[0].id;
            
            // Insert referral record
            await sql`
              INSERT INTO referral_signups (referrer_user_id, new_user_id, referrer_email, new_user_email, created_at)
              VALUES (${referrerId}, ${userId}, ${referrerEmail.toLowerCase()}, ${email.toLowerCase()}, ${now})
            `;
            
            // Award referral bonuses
            const refBonusRows = await sql`
              SELECT value FROM app_config WHERE key = 'referral_referrer_bonus'
            `;
            const newBonusRows = await sql`
              SELECT value FROM app_config WHERE key = 'referral_new_bonus'
            `;
            
            const refBonus = refBonusRows[0]?.value ? parseInt(refBonusRows[0].value) : 50;
            const newBonus = newBonusRows[0]?.value ? parseInt(newBonusRows[0].value) : 25;
            
            // Award referrer
            await sql`
              INSERT INTO credits_ledger (user_id, request_id, action, amount, status, meta, created_at)
              VALUES (${referrerId}, ${uuidv4()}, 'referral_referrer', ${refBonus}, 'granted', '{"reason": "referral_referrer", "new_user_id": ${userId}}', ${now})
            `;
            
            // Award new user
            await sql`
              INSERT INTO credits_ledger (user_id, request_id, action, amount, status, meta, created_at)
              VALUES (${userId}, ${uuidv4()}, 'referral_new', ${newBonus}, 'granted', '{"reason": "referral_new", "referrer_user_id": ${referrerId}}', ${now})
            `;
            
            // Update balances
            await sql`
              UPDATE user_credits SET balance = balance + ${refBonus} WHERE user_id = ${referrerId}
            `;
            
            await sql`
              UPDATE user_credits SET balance = balance + ${newBonus} WHERE user_id = ${userId}
            `;
            
            console.log(`Referral processed: ${refBonus} credits to referrer, ${newBonus} credits to new user`);
          }
        } catch (referralError) {
          console.error('Referral processing failed:', referralError);
          // Don't fail the main flow if referral fails
        }
      }
    }
    
    // 4) Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Missing JWT_SECRET environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }
    
    const token = jwt.sign(
      { 
        sub: userId, 
        email: email.toLowerCase(),
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { 
        expiresIn: '7d',
        audience: 'stefna-app',
        issuer: 'stefna'
      }
    );
    
    console.log('JWT token generated successfully');
    
    // 5) Send welcome email for new users
    if (isNewUser) {
      try {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'Stefna <hello@stefna.xyz>',
            to: [email],
            subject: 'Welcome to Stefna – Your 30 Credits Are Ready',
            text: `Welcome to Stefna.

Your account is now active, and we've already added 30 credits to get you started. That's enough to generate up to 15 high-quality images today. Credits reset daily, so you'll get 30 more tomorrow.

There are no tiers, no gimmicks, and no social media verification. Everyone gets the same creative power.

Start generating now.

— The Stefna Team`
          });
          console.log('Welcome email sent successfully');
        }
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
        // Don't fail the main flow if email fails
      }
    }
    
    // 6) Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: userId,
          email: email.toLowerCase(),
          isNewUser
        }
      })
    };
    
  } catch (error: any) {
    console.error('=== VERIFY OTP FUNCTION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      })
    };
  }
};
