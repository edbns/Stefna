const { neon } = require('@neondatabase/serverless');
const { Resend } = require('resend');

exports.handler = async (event, context) => {
  console.log('=== OTP REQUEST FUNCTION STARTED ===');
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
    const { email } = JSON.parse(event.body);
    console.log('Parsed email:', email);

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Valid email is required' })
      };
    }

    // Check required environment variables
    const databaseUrl = process.env.NETLIFY_DATABASE_URL;
    const resendApiKey = process.env.RESEND_API_KEY;
    
    console.log('=== ENVIRONMENT VARIABLES ===');
    console.log('NETLIFY_DATABASE_URL:', databaseUrl ? 'LOADED' : 'MISSING');
    console.log('RESEND_API_KEY:', resendApiKey ? 'LOADED' : 'MISSING');
    
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

    if (!resendApiKey) {
      console.error('Missing Resend API key');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email service configuration error' })
      };
    }
    
    console.log('=== CREATING NEON CLIENT ===');
    const sql = neon(databaseUrl);
    console.log('Neon client:', sql ? 'CREATED' : 'FAILED TO CREATE');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('=== GENERATED OTP ===');
    console.log('OTP:', otp);
    console.log('Expires at:', expiresAt.toISOString());

    // Try to create OTP table with error handling
    try {
      console.log('=== CREATING OTP TABLE ===');
      await sql`
        CREATE TABLE IF NOT EXISTS auth_otps (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text NOT NULL,
          code text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          expires_at timestamptz NOT NULL,
          used boolean DEFAULT false
        )
      `;
      
      // Create indexes
      await sql`
        CREATE INDEX IF NOT EXISTS auth_otps_email_idx ON auth_otps(email);
        CREATE INDEX IF NOT EXISTS auth_otps_expires_idx ON auth_otps(expires_at);
      `;
      
      console.log('OTP table and indexes created successfully');
    } catch (tableError) {
      console.error('Failed to create OTP table:', tableError);
      // Continue anyway - table might already exist
    }

    // Try to insert OTP
    let otpInserted = false;
    try {
      console.log('=== INSERTING OTP ===');
      const insertResult = await sql`
        INSERT INTO auth_otps (email, code, expires_at)
        VALUES (${email.toLowerCase()}, ${otp}, ${expiresAt.toISOString()})
        RETURNING id
      `;
      
      console.log('OTP inserted successfully:', insertResult[0]);
      otpInserted = true;
    } catch (insertError) {
      console.error('Failed to insert OTP:', insertError);
      // Continue with email sending even if DB insert fails
    }

    // Send email via Resend
    console.log('=== SENDING EMAIL ===');
    const resend = new Resend(resendApiKey);
    
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Stefna <hello@stefna.xyz>',
        to: [email],
        subject: `Your Stefna Login Code: ${otp}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Stefna Login Code</title>
            <style>
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000000; color: #ffffff; }
              .container { max-width: 600px; margin: 0 auto; background: #000000; }
              .header { background: #000000; padding: 40px 20px; text-align: center; }
              .logo { font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
              .content { padding: 40px 30px; background: #000000; text-align: center; }
              .title { font-size: 28px; font-weight: 600; color: #ffffff; margin-bottom: 40px; }
              .otp-box { background: #111111; border: 2px solid #333333; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px; }
              .otp-label { font-size: 14px; font-weight: 600; color: #cccccc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
              .otp-code { font-size: 42px; font-weight: 700; color: #ffffff; letter-spacing: 12px; margin-bottom: 15px; font-family: 'Courier New', monospace; }
              .otp-expiry { font-size: 14px; color: #999999; }
              .info-box { background: #111111; border-left: 4px solid #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
              .info-title { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 10px; }
              .info-text { font-size: 14px; color: #cccccc; line-height: 1.5; margin: 0; }
              .footer { background: #111111; padding: 30px; text-align: center; border-top: 1px solid #333333; }
              .footer-text { font-size: 14px; color: #999999; margin: 0; }
              .contact-info { font-size: 14px; color: #ffffff; margin-top: 15px; }
              @media (max-width: 600px) {
                .content { padding: 30px 20px; }
                .otp-code { font-size: 36px; letter-spacing: 8px; }
                .header { padding: 30px 20px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">STEFNA</div>
              </div>
              
              <div class="content">
                <h1 class="title">Your Login Code</h1>
                
                <div class="otp-box">
                  <div class="otp-label">Verification Code</div>
                  <div class="otp-code">${otp}</div>
                  <div class="otp-expiry">Valid for 10 minutes</div>
                </div>
                
                <div class="info-box">
                  <div class="info-title">Security Information</div>
                  <p class="info-text">
                    This code was requested for your Stefna account. If you didn't request this code, 
                    please ignore this email and ensure your account password is secure.
                  </p>
                </div>
              </div>
              
              <div class="footer">
                <p class="footer-text">© 2025 Stefna. All rights reserved.</p>
                <p class="contact-info">If you have any questions, contact us at hello@stefna.xyz</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Failed to send email',
            details: emailError.message || 'Unknown email error'
          })
        };
      }
      
      console.log('=== EMAIL SENT SUCCESSFULLY ===');
      console.log('Email data:', emailData);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          otpStored: otpInserted
        })
      };

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to send email',
          details: emailError.message || 'Unknown email error'
        })
      };
    }

  } catch (err) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Function error:', err);
    console.error('Error stack:', err.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: err.message || 'Unknown error'
      })
    };
  }
}; 