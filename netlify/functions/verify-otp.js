const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

exports.handler = async (event, context) => {
  console.log('=== VERIFY OTP FUNCTION STARTED ===');
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const { email, otp } = JSON.parse(event.body || '{}');
    console.log('Input:', { email, otp });
    if (!email || !otp) {
      return { statusCode: 400, body: 'Email and OTP required' };
    }

    // Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('Supabase client created.');

    // 1) Verify OTP exists, not used, and not expired
    const now = new Date().toISOString();
    const { data: otpRows, error: selectErr } = await supabase
      .from('user_otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .gte('expires_at', now);
    console.log('OTP lookup result:', otpRows, selectErr);

    if (selectErr) throw selectErr;
    if (!otpRows || otpRows.length === 0) {
      return { statusCode: 401, body: 'Invalid or expired OTP' };
    }

    // 2) Mark OTP as used
    const otpId = otpRows[0].id;
    const { error: updateErr } = await supabase
      .from('user_otps')
      .update({ used: true })
      .eq('id', otpId);
    console.log('Marked OTP used, error:', updateErr);
    if (updateErr) throw updateErr;

    // 3) Check if user exists
    console.log('Checking if user exists with email:', email);
    const { data: existingUser, error: userCheckErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    console.log('User check result:', existingUser, userCheckErr);

    let user;
    let isNewUser = false;
    if (userCheckErr && userCheckErr.code === 'PGRST116') {
      // User doesn't exist, create new user
      console.log('User does not exist, creating new user');
      const userData = {
        id: uuidv4(), // Generate UUID manually
        email: email,
        name: email.split('@')[0], // Use email prefix as name
        tier: 'registered',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
      console.log('Creating user with data:', userData);
      
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      console.log('User creation result:', newUser, createErr);
      
      if (createErr) throw createErr;
      user = newUser;
      isNewUser = true;
    } else if (userCheckErr) {
      // Other error occurred
      throw userCheckErr;
    } else {
      // User exists, update last_login_at
      console.log('User exists, updating last_login_at');
      const { data: updatedUser, error: updateUserErr } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('email', email)
        .select()
        .single();
      console.log('User update result:', updatedUser, updateUserErr);
      
      if (updateUserErr) throw updateUserErr;
      user = updatedUser;
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
      tier: user.tier,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    
    const token = jwt.sign(tokenPayload, jwtSecret);
    console.log('JWT token generated successfully');

    // 6) Success - set HttpOnly cookie for session
    const maxAge = 7 * 24 * 60 * 60
    const cookie = `stefna_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
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
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
}; 