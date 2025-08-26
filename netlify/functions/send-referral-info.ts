// netlify/functions/send-referral-info.ts
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
    const { to } = JSON.parse(event.body || '{}');
    
    if (!to) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email address is required' })
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
      subject: 'Invite Friends, Earn 50 Credits',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referral Program</title>
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
        .rewards-box { 
            background-color: #f8f9fa; 
            border: 2px solid #dee2e6; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .reward { 
            display: inline-block; 
            margin: 20px; 
            padding: 20px; 
            background-color: #ffffff; 
            border-radius: 8px; 
            border: 1px solid #dee2e6;
            min-width: 120px;
        }
        .credits { 
            font-size: 24px; 
            font-weight: 700; 
            color: #000000; 
            margin: 10px 0;
        }
        .highlight { 
            background-color: #e9ecef; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 20px 0;
            text-align: center;
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
            <h1>REFERRAL PROGRAM</h1>
        </div>
        
        <div class="content">
            <h2 style="margin-top: 0; color: #000000;">Love Stefna? Share it.</h2>
            <p>Invite your friends and get rewarded. For every friend who signs up using your referral link:</p>
            
            <div class="rewards-box">
                <div class="reward">
                    <div class="credits">50 Credits</div>
                    <p>You get</p>
                </div>
                <div class="reward">
                    <div class="credits">25 Credits</div>
                    <p>They get</p>
                </div>
            </div>
            
            <div class="highlight">
                <strong>No limits. Real rewards. Simple as that.</strong>
            </div>
            
            <div style="text-align: center;">
                <a href="https://stefna.xyz" class="cta">Check Your Profile</a>
            </div>
            
            <p style="text-align: center; color: #6c757d; margin-top: 20px;">
                Check your profile to grab your referral link.
            </p>
        </div>
        
        <div class="footer">
            <p>The Stefna Team</p>
        </div>
    </div>
</body>
</html>`,
      text: `Love Stefna? Share it.

Invite your friends and get rewarded. For every friend who signs up using your referral link:

You get 50 credits

They get 25 credits

No limits. Real rewards. Simple as that.

Check your profile to grab your link.

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
        message: 'Referral info email sent successfully' 
      })
    };

  } catch (error) {
    console.error('❌ send-referral-info error:', error);
    
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
