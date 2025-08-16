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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
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

    // Connect to Neon database
    const databaseUrl = process.env.NETLIFY_DATABASE_URL;
    console.log('=== ENVIRONMENT VARIABLES ===');
    console.log('NETLIFY_DATABASE_URL:', databaseUrl ? 'LOADED' : 'MISSING');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'LOADED' : 'MISSING');
    
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('=== GENERATED OTP ===');
    console.log('OTP:', otp);
    console.log('Expires at:', expiresAt.toISOString());

    // Check if user exists in Neon database
    console.log('=== CHECKING USER EXISTS ===');
    const existingUser = await sql`
      SELECT id, email FROM app_users WHERE email = ${email.toLowerCase()}
    `;
    
    if (existingUser.length === 0) {
      // Create user if they don't exist
      console.log('=== CREATING NEW USER ===');
      const newUser = await sql`
        INSERT INTO users (id, email, external_id, created_at, updated_at)
        VALUES (gen_random_uuid(), ${email.toLowerCase()}, ${email.toLowerCase()}, NOW(), NOW())
        RETURNING id, email
      `;
      console.log('New user created:', newUser[0]);
    } else {
      console.log('User exists:', existingUser[0]);
    }

    // Save OTP to database (create simple OTP table if it doesn't exist)
    console.log('=== ATTEMPTING TO INSERT OTP ===');
    
    // Create OTP table if it doesn't exist
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
    
    const insertData = {
      email: email.toLowerCase(),
      code: otp,
      expires_at: expiresAt.toISOString()
    };
    console.log('Insert data:', insertData);
    
    const insertResult = await sql`
      INSERT INTO auth_otps (email, code, expires_at)
      VALUES (${insertData.email}, ${insertData.code}, ${insertData.expires_at})
      RETURNING id
    `;
    
    console.log('OTP inserted successfully:', insertResult[0]);

    // Send email via Resend
    console.log('=== SENDING EMAIL ===');
    const resendApiKey = process.env.RESEND_API_KEY;
    
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
    
    console.log('Creating Resend client...');
    const resend = new Resend(resendApiKey);
    console.log('Resend client created successfully');
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Stefna <hello@stefna.xyz>',
      to: [email],
      subject: `Your Stefna Login Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
          <div style="text-align: center; padding: 40px 20px;">
            <img src="https://stefna.xyz/logo.png" alt="Stefna" style="width: 80px; height: 80px; margin-bottom: 30px;">
            
            <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 10px;">Login Code</h1>
            <p style="color: #cccccc; font-size: 16px; margin-bottom: 40px;">Enter this code to access your Stefna dashboard</p>
            
            <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <p style="color: #888888; font-size: 12px; text-transform: uppercase; margin-bottom: 15px;">Your Login Code</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin-bottom: 15px;">${otp}</div>
              <p style="color: #888888; font-size: 12px; text-transform: uppercase;">Valid for 10 minutes</p>
            </div>
            
            <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px;">
              <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 15px;">What is this code?</h2>
              <p style="color: #cccccc; font-size: 14px; line-height: 1.5;">This is your one-time login code for Stefna. Enter this code on the login page to access your dashboard and view trending content from YouTube, Reddit, Crypto, News, and more.</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #333333; padding: 30px 20px; text-align: center;">
            <p style="color: #ffffff; font-size: 14px; margin-bottom: 5px;">Stefna - Turn Moments into Masterpieces—No Limits</p>
            <p style="color: #888888; font-size: 12px; margin-bottom: 5px;">This email was sent to ${email}</p>
            <p style="color: #888888; font-size: 12px;">If you have any questions, contact us at <span style="background-color: #ffff00; color: #000000; padding: 2px 4px;">hello@stefna.xyz</span></p>
          </div>
        </div>
      `
    });

    if (emailError) {
      console.error('=== EMAIL ERROR ===');
      console.error('Email error:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        statusCode: emailError.statusCode,
        name: emailError.name
      });
      console.error('Full email error object:', JSON.stringify(emailError, null, 2));
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
        message: 'OTP sent successfully' 
      })
    };

  } catch (err) {
    console.error('=== FUNCTION ERROR ===');
    console.error('Function error:', err);
    console.error('Error stack:', err.stack);
    console.error('Full error object:', JSON.stringify(err, null, 2));
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