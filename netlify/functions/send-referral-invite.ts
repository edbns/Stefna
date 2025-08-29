// netlify/functions/send-referral-invite.ts
import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, referrerEmail } = JSON.parse(event.body || '{}');
    
    if (!to || !referrerEmail) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email address and referrer email are required' })
      };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    const resend = new Resend(resendApiKey);
    
    await resend.emails.send({
      from: 'Stefna <hello@stefna.xyz>',
      to: [to],
      subject: 'You\'ve Been Invited to Stefna – 25 Free Credits Inside',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefna Invitation</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #000000; 
            color: #ffffff;
        }
                            .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: #000000; 
                        padding: 40px 30px;
                        text-align: center;
                    }
        .logo { 
            text-align: center; 
            margin-bottom: 40px;
        }
        .logo img {
            height: 60px;
            width: auto;
        }
                            .content { 
                        line-height: 1.6;
                        text-align: center;
                    }
        .bonus-box { 
            background-color: #1a1a1a; 
            border: 2px solid #333333; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .credits { 
            font-size: 32px; 
            font-weight: 700; 
            color: #ffffff; 
            margin: 20px 0;
        }
        .highlight { 
            background-color: #1a1a1a; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 20px 0;
            border: 1px solid #333333;
        }
        .cta { 
            background-color: #ffffff; 
            color: #000000; 
            padding: 15px 30px; 
            border-radius: 6px; 
            text-decoration: none; 
            display: inline-block; 
            margin: 20px 0; 
            font-weight: 600;
        }
                            .footer { 
                        margin-top: 40px; 
                        text-align: center; 
                        color: #ffffff; 
                        font-size: 14px;
                        border-top: 1px solid #333333;
                        padding-top: 20px;
                    }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://stefna.xyz/logo.png" alt="Stefna" />
        </div>
        
        <div class="content">
            <h2 style="margin-top: 0; color: #ffffff;">You've Been Invited!</h2>
            <p>Someone invited you to try Stefna — a new way to create high-quality AI images (and soon, videos).</p>
            
            <div class="bonus-box">
                <div class="credits">25 Bonus Credits</div>
                <p>As a referred user, you get <strong>25 bonus credits</strong> the moment you sign up.</p>
                <p>No subscriptions, no verification, just creative freedom with a daily 30 credit limit for everyone.</p>
            </div>
            
            <div class="highlight">
                <strong>Use your 25 extra credits however you like — on top of your daily allowance.</strong>
            </div>
            
            <div style="text-align: center;">
                <a href="https://stefna.xyz/auth" class="cta">Join Now & Start Creating</a>
            </div>
            
            <p style="font-size: 14px; color: #cccccc; text-align: center; margin-top: 20px;">
                When you sign up, make sure to mention that <strong>${referrerEmail}</strong> invited you to get your bonus credits.
            </p>
        </div>
        
        <div class="footer">
            <p>This email was sent to: ${to}</p>
            <p>Stefna 2025 all rights reserved</p>
        </div>
    </div>
</body>
</html>`,
      text: `Someone invited you to try Stefna — a new way to create high-quality AI images (and soon, videos).

As a referred user, you get 25 bonus credits the moment you sign up.

No subscriptions, no verification, just creative freedom with a daily 30 credit limit for everyone.

Use your 25 extra credits however you like — on top of your daily allowance.

Join now and start creating:

Click Here: https://stefna.xyz/auth

When you sign up, make sure to mention that ${referrerEmail} invited you to get your bonus credits.

— The Stefna Team`
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true, 
        message: 'Referral invite email sent successfully' 
      })
    };

  } catch (error) {
    console.error('❌  glitchsend-referral-invite error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
