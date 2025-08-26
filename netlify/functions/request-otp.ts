import type { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const handler: Handler = async (event) => {
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
      }
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
    const { email } = JSON.parse(event.body || '{}');
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
    const resendApiKey = process.env.RESEND_API_KEY;
    
    console.log('=== ENVIRONMENT VARIABLES ===');
    console.log('RESEND_API_KEY:', resendApiKey ? 'LOADED' : 'MISSING');
    
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
    
    console.log('=== USING PRISMA CLIENT ===');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('=== GENERATED OTP ===');
    console.log('OTP:', otp);
    console.log('Expires at:', expiresAt.toISOString());

    // Insert OTP using Prisma
    let otpInserted = false;
    try {
      console.log('=== INSERTING OTP WITH PRISMA ===');
      const insertResult = await prisma.authOtp.create({
        data: {
          id: uuidv4(),
          email: email.toLowerCase(),
          code: otp,
          expiresAt: expiresAt
        }
      });
      
      console.log('OTP inserted successfully:', insertResult.id);
      otpInserted = true;
    } catch (insertError) {
      console.error('Failed to insert OTP with Prisma:', insertError);
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
            background-color: #f8f9fa; 
            color: #212529;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background-color: #000000; 
            color: #ffffff; 
            padding: 40px 30px; 
            text-align: center;
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
            letter-spacing: -0.5px;
        }
        .content { 
            padding: 40px 30px; 
            line-height: 1.6;
        }
        .otp-box { 
            background-color: #f8f9fa; 
            border: 2px solid #dee2e6; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .otp-code { 
            font-size: 36px; 
            font-weight: 700; 
            color: #000000; 
            letter-spacing: 4px; 
            font-family: 'Courier New', monospace;
        }
        .expiry { 
            color: #6c757d; 
            font-size: 14px; 
            margin-top: 15px;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            color: #6c757d; 
            font-size: 14px;
            border-top: 1px solid #dee2e6;
        }
        .warning { 
            background-color: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 6px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>STEFNA</h1>
        </div>
        
        <div class="content">
            <h2 style="margin-top: 0; color: #000000;">Your Login Code</h2>
            <p>Here's your one-time login code to access your Stefna account:</p>
            
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry">Expires in 10 minutes</div>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> If you didn't request this code, you can safely ignore this email.
            </div>
        </div>
        
        <div class="footer">
            <p>The Stefna Team</p>
        </div>
    </div>
</body>
</html>`,
        text: `Here's your one-time login code:

${otp}

It expires in 10 minutes. If you didn't request this code, you can ignore this email.

— The Stefna Team`
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
          otpSent: otpInserted
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

  } catch (error: any) {
    console.error('=== OTP REQUEST ERROR ===');
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
        details: error.message || 'Unknown error occurred'
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};
