const { neon } = require('@neondatabase/serverless');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

exports.handler = async (event, context) => {
  console.log('=== VERIFY OTP FUNCTION STARTED ===');
  
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
    
    console.log('OTP marked as used successfully');

    // 3) Check if user exists in Neon database
    console.log('Checking if user exists with email:', email);
    
    // First check if user exists in the users table
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${email.toLowerCase()}
    `;
    
    console.log('User check result:', existingUsers);

    let user;
    let isNewUser = false;
    
    if (existingUsers.length === 0) {
      // User doesn't exist, create new user
      console.log('User does not exist, creating new user');
      const userId = uuidv4();
      const userData = {
        id: userId,
        email: email.toLowerCase(),
        name: email.split('@')[0], // Use email prefix as name
        created_at: new Date().toISOString()
      };
      console.log('Creating user with data:', userData);
      
      const newUser = await sql`
        INSERT INTO users (id, email, name, created_at)
        VALUES (${userData.id}, ${userData.email}, ${userData.name}, ${userData.created_at})
        RETURNING *
      `;
      
      console.log('User creation result:', newUser[0]);
      user = newUser[0];
      isNewUser = true;

      // Process referral if provided
      if (referrerEmail) {
        console.log(`🎁 Processing referral for new user: ${referrerEmail} -> ${email}`);
        try {
          const referralResponse = await fetch(`${event.headers.origin || 'https://stefna.xyz'}/.netlify/functions/process-referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrerEmail: referrerEmail,
              newUserId: user.id,
              newUserEmail: email
            })
          });

          if (referralResponse.ok) {
            const referralResult = await referralResponse.json();
            console.log(`✅ Referral processed: ${referralResult.totalAwarded} total credits awarded`);
          } else {
            console.log(`⚠️ Referral processing failed: ${referralResponse.status}`);
          }
        } catch (referralError) {
          console.error('❌ Referral processing error:', referralError);
          // Don't fail signup if referral processing fails
        }
      }
    } else {
      // User exists, update last_login
      console.log('User exists, updating last_login');
      const existingUser = existingUsers[0];
      
      const updatedUser = await sql`
        UPDATE users 
        SET last_login = ${new Date().toISOString()}
        WHERE id = ${existingUser.id}
        RETURNING *
      `;
      
      console.log('User update result:', updatedUser[0]);
      user = updatedUser[0];
    }

    // 4) Send welcome email for new users (with 5-minute delay)
    if (isNewUser) {
      console.log('Scheduling welcome email to new user:', email);
      // Send welcome email after 5 minutes
      setTimeout(async () => {
        try {
          const resendApiKey = process.env.RESEND_API_KEY;
          if (resendApiKey) {
            const resend = new Resend(resendApiKey);
            const { data: emailData, error: emailError } = await resend.emails.send({
              from: 'Stefna <hello@stefna.xyz>',
              to: [email],
              subject: 'Your Creative Playground Awaits 🖤',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; min-height: 100vh;">
                  <div style="text-align: center; padding: 60px 20px;">
                    <!-- Logo centered in the middle -->
                    <img src="https://stefna.xyz/logo.png" alt="Stefna" style="width: 120px; height: 120px; margin-bottom: 40px;">
                    
                    <!-- Welcome content -->
                    <div style="background-color: #1a1a1a; padding: 40px; border-radius: 15px; margin-bottom: 30px;">
                      <h1 style="color: #ffffff; font-size: 28px; margin-bottom: 30px; font-weight: 300;">Hello,</h1>
                      
                      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Welcome to Stefna, where creativity meets possibility. Here, AI is your brush—ready to help you remix, enhance, and reimagine photos and videos in ways only you can imagine.
                      </p>
                      
                      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Start exploring, start experimenting, and don't be shy about sharing what you make. The world is waiting to see your vision.
                      </p>
                      
                      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Let's see what you can do with <span style="color: #ffffff; font-weight: bold;">#AIasabrush</span>.
                      </p>
                      
                      <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin-top: 40px;">Stefna</p>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="border-top: 1px solid #333333; padding: 30px 20px; text-align: center;">
                    <p style="color: #ffffff; font-size: 14px; margin-bottom: 5px;">Stefna - Turn Moments into Masterpieces—No Limits</p>
                    <p style="color: #888888; font-size: 12px; margin-bottom: 5px;">This email was sent to ${email}</p>
                    <p style="color: #888888; font-size: 12px;">If you have any questions, contact us at <span style="background-color: #ffff00; color: #000000; padding: 2px 4px;">hello@stefna.xyz</span></p>
                  </div>
                </div>
              `
            });

            if (emailError) {
              console.error('Welcome email error:', emailError);
              // Don't fail the entire process if welcome email fails
            } else {
              console.log('Welcome email sent successfully after 5 minutes:', emailData);
            }
          }
        } catch (emailErr) {
          console.error('Failed to send welcome email:', emailErr);
          // Don't fail the entire process if welcome email fails
        }
      }, 5 * 60 * 1000); // 5 minutes delay
    }

    // 5) Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };
    
    const token = jwt.sign(tokenPayload, jwtSecret);
    console.log('JWT token generated successfully');

    // 6) Success - return token in response body for frontend storage
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        user,
        token 
      }),
    };

  } catch (err) {
    console.error('Verify-OTP error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
}; 