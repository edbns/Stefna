const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;

console.log('Environment variables check:');
console.log('RESEND_API_KEY exists:', !!resendApiKey);
console.log('RESEND_API_KEY length:', resendApiKey ? resendApiKey.length : 0);
console.log('RESEND_API_KEY starts with re_:', resendApiKey ? resendApiKey.startsWith('re_') : false);

if (!resendApiKey) {
  console.error('RESEND_API_KEY environment variable is not set');
}

// Initialize Resend with the API key - using the correct pattern
const resend = resendApiKey ? new Resend(resendApiKey) : null;

exports.handler = async (event) => {
  const { email, otp } = JSON.parse(event.body || '{}');

  if (!email || !otp) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing email or OTP' }),
    };
  }

  if (!resendApiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Email service not configured',
        error: 'RESEND_API_KEY environment variable is not set. Please configure it in Netlify environment variables.'
      }),
    };
  }

  try {
    await resend.emails.send({
      from: 'Hello <hello@stefna.xyz>',
      to: email,
      subject: 'Your Stefna Login Code',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Stefna Login Code</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #000000;
              color: #ffffff;
              line-height: 1.6;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #000000;
              padding: 40px 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            
            .logo {
              width: 120px;
              height: auto;
              margin-bottom: 20px;
            }
            
            .title {
              font-size: 28px;
              font-weight: 700;
              color: #ffffff;
              margin-bottom: 10px;
              letter-spacing: -0.5px;
            }
            
            .subtitle {
              font-size: 16px;
              color: #cccccc;
              margin-bottom: 40px;
            }
            
            .otp-container {
              background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              margin-bottom: 40px;
              border: 1px solid #333333;
            }
            
            .otp-code {
              font-size: 48px;
              font-weight: 700;
              color: #ffffff;
              letter-spacing: 8px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
              background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            .otp-label {
              font-size: 14px;
              color: #cccccc;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            
            .info-section {
              background-color: #111111;
              border-radius: 12px;
              padding: 30px;
              margin-bottom: 30px;
              border: 1px solid #333333;
            }
            
            .info-title {
              font-size: 18px;
              font-weight: 600;
              color: #ffffff;
              margin-bottom: 15px;
            }
            
            .info-text {
              font-size: 14px;
              color: #cccccc;
              line-height: 1.7;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 30px;
              border-top: 1px solid #333333;
            }
            
            .footer-text {
              font-size: 12px;
              color: #888888;
              line-height: 1.5;
            }
            
            .security-note {
              background-color: #1a1a1a;
              border-radius: 8px;
              padding: 20px;
              margin-top: 30px;
              border-left: 4px solid #ffffff;
            }
            
            .security-title {
              font-size: 14px;
              font-weight: 600;
              color: #ffffff;
              margin-bottom: 8px;
            }
            
            .security-text {
              font-size: 12px;
              color: #cccccc;
            }
            
            @media only screen and (max-width: 600px) {
              .container {
                padding: 20px 15px;
              }
              
              .otp-container {
                padding: 30px 20px;
              }
              
              .otp-code {
                font-size: 36px;
                letter-spacing: 6px;
              }
              
              .title {
                font-size: 24px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://stefna.xyz/stefna-logo.png" alt="Stefna" class="logo">
              <h1 class="title">Login Code</h1>
              <p class="subtitle">Enter this code to access your Stefna dashboard</p>
            </div>
            
            <div class="otp-container">
              <div class="otp-label">Your Login Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Valid for 10 minutes</div>
            </div>
            
            <div class="info-section">
              <h2 class="info-title">What is this code?</h2>
              <p class="info-text">
                This is your one-time login code for Stefna. Enter this code on the login page to access your dashboard and view trending content from YouTube, Reddit, Crypto, News, and more.
              </p>
            </div>
            
            <div class="security-note">
              <div class="security-title">Security Notice</div>
              <div class="security-text">
                This code will expire in 10 minutes for your security. If you didn't request this code, please ignore this email. Never share this code with anyone.
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                Stefna - Discover What's Trending Worldwide<br>
                This email was sent to ${email}<br>
                If you have any questions, contact us at hello@stefna.xyz
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'OTP sent successfully' }),
    };
  } catch (error) {
    console.error('Resend error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to send OTP', error: error.message }),
    };
  }
}; 