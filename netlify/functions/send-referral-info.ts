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
        .rewards-box { 
            background-color: #1a1a1a; 
            border: 2px solid #333333; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .reward { 
            display: inline-block; 
            margin: 20px; 
            padding: 20px; 
            background-color: #1a1a1a; 
            border-radius: 8px; 
            border: 1px solid #333333;
            min-width: 120px;
        }
        .credits { 
            font-size: 24px; 
            font-weight: 700; 
            color: #ffffff; 
            margin: 10px 0;
        }
        .highlight { 
            background-color: #1a1a1a; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 20px 0;
            text-align: center;
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
            <h2 style="margin-top: 0; color: #ffffff;">Love Stefna? Share it.</h2>
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
            
            <p style="text-align: center; color: #cccccc; margin-top: 20px;">
                Check your profile to grab your referral link.
            </p>
        </div>
        
        <div class="footer">
            <p>This email was sent to: ${to}</p>
            <p>Stefna 2025 all rights reserved</p>
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
