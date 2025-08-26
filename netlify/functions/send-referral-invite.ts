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
        .bonus-box { 
            background-color: #f8f9fa; 
            border: 2px solid #dee2e6; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .credits { 
            font-size: 32px; 
            font-weight: 700; 
            color: #000000; 
            margin: 20px 0;
        }
        .highlight { 
            background-color: #e9ecef; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 20px 0;
        }
        .cta { 
            background-color: #000000; 
            color: #ffffff; 
            padding: 15px 30px; 
            border-radius: 6px; 
            text-decoration: none; 
            display: inline-block; 
            margin: 20px 0;
            font-weight: 600;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            color: #6c757d; 
            font-size: 14px;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>STEFNA INVITATION</h1>
        </div>
        
        <div class="content">
            <h2 style="margin-top: 0; color: #000000;">You've Been Invited!</h2>
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
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 20px;">
                When you sign up, make sure to mention that <strong>${referrerEmail}</strong> invited you to get your bonus credits.
            </p>
        </div>
        
        <div class="footer">
            <p>The Stefna Team</p>
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
    console.error('❌ send-referral-invite error:', error);
    
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
