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
              body { 
                margin: 0; 
                padding: 0; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background: #000000; 
                color: #ffffff; 
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: #000000; 
                padding: 40px 20px;
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px;
              }
              .logo-icon { 
                width: 48px; 
                height: 48px; 
                border: 2px solid #ffffff; 
                border-radius: 8px; 
                margin: 0 auto 20px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
              }
              .title { 
                font-size: 32px; 
                font-weight: 700; 
                color: #ffffff; 
                margin-bottom: 20px; 
              }
              .subtitle { 
                font-size: 16px; 
                color: #cccccc; 
                line-height: 1.5;
                margin-bottom: 40px;
              }
              .otp-section { 
                background: #1a1a1a; 
                border-radius: 16px; 
                padding: 30px; 
                text-align: center; 
                margin-bottom: 30px; 
              }
              .otp-label { 
                font-size: 12px; 
                font-weight: 600; 
                color: #999999; 
                text-transform: uppercase; 
                letter-spacing: 1px; 
                margin-bottom: 20px; 
              }
              .otp-code { 
                font-size: 48px; 
                font-weight: 700; 
                color: #ffffff; 
                letter-spacing: 8px; 
                margin-bottom: 20px; 
                font-family: 'Courier New', monospace;
              }
              .otp-expiry { 
                font-size: 12px; 
                color: #999999; 
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .security-section { 
                background: #1a1a1a; 
                border-radius: 16px; 
                padding: 30px; 
                text-align: left;
                margin-bottom: 40px;
              }
              .security-title { 
                font-size: 18px; 
                font-weight: 600; 
                color: #ffffff; 
                margin-bottom: 15px; 
                text-align: center;
              }
              .security-text { 
                font-size: 14px; 
                color: #cccccc; 
                line-height: 1.6; 
                margin: 0; 
                text-align: center;
              }
              .footer { 
                text-align: center; 
                padding-top: 30px; 
                border-top: 1px solid #333333; 
              }
              .company-slogan { 
                font-size: 16px; 
                font-weight: 600; 
                color: #ffffff; 
                margin-bottom: 20px; 
              }
              .footer-text { 
                font-size: 14px; 
                color: #999999; 
                margin: 0 0 10px 0; 
              }
              .contact-info { 
                font-size: 14px; 
                color: #ffffff; 
                margin-top: 15px; 
              }
              .email-highlight { 
                background: #ffd700; 
                color: #000000; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-weight: 600;
              }
              @media (max-width: 600px) {
                .container { padding: 30px 15px; }
                .otp-code { font-size: 36px; letter-spacing: 6px; }
                .title { font-size: 28px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo-icon">S</div>
                <h1 class="title">Login Code</h1>
                <p class="subtitle">Enter this code to access your Stefna dashboard</p>
              </div>
              
              <div class="otp-section">
                <div class="otp-label">YOUR LOGIN CODE</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">VALID FOR 10 MINUTES</div>
              </div>
              
              <div class="security-section">
                <div class="security-title">Security Information</div>
                <p class="security-text">
                  This code was requested for your Stefna account. If you didn't request this code, 
                  please ignore this email and ensure your account password is secure.
                </p>
              </div>
              
              <div class="footer">
                <div class="company-slogan">Stefna - Turn Moments into Masterpieces—No Limits</div>
                <p class="footer-text">This email was sent to ${email}</p>
                <p class="contact-info">If you have any questions, contact us at <span class="email-highlight">hello@stefna.xyz</span></p>
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