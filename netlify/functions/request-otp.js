const { createClient } = require('@supabase/supabase-js');
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

    // Connect to Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('=== ENVIRONMENT VARIABLES ===');
    console.log('SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'UNDEFINED');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'LOADED' : 'MISSING');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'LOADED' : 'MISSING');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Database configuration error' })
      };
    }
    
    console.log('=== CREATING SUPABASE CLIENT ===');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client:', supabase ? 'CREATED' : 'FAILED TO CREATE');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('=== GENERATED OTP ===');
    console.log('OTP:', otp);
    console.log('Expires at:', expiresAt.toISOString());

    // Test Supabase connection first
    console.log('=== TESTING SUPABASE CONNECTION ===');
    const { data: testData, error: testError } = await supabase
      .from('user_otps')
      .select('count')
      .limit(1);
    
    console.log('Test query result:', { data: testData, error: testError });

    // Save OTP to database
    console.log('=== ATTEMPTING TO INSERT OTP ===');
    const insertData = {
      email: email.toLowerCase(),
      otp: otp,
      expires_at: expiresAt.toISOString(),
      used: false
    };
    console.log('Insert data:', insertData);
    
    const { error: insertError } = await supabase
      .from('user_otps')
      .insert(insertData);

    if (insertError) {
      console.error('=== DATABASE INSERT ERROR ===');
      console.error('Database error:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      console.error('Full error object:', JSON.stringify(insertError, null, 2));
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to save OTP',
          details: insertError.message || 'Unknown database error'
        })
      };
    }
    
    console.log('=== OTP SAVED SUCCESSFULLY ===');

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