// netlify/functions/send-credit-warning.ts
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
    const { to, usagePercentage, dailyUsed, dailyCap, remainingCredits, isCritical } = JSON.parse(event.body || '{}');
    
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
    
    // Enhanced email content based on usage data
    let subject, html, text;
    
    if (isCritical) {
      subject = 'Critical: You\'re Almost Out of Credits Today';
            html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Critical Credit Warning</title>
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
        }
        .warning-box { 
            background-color: #1a1a1a; 
            border: 2px solid #dc3545; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .usage { 
            font-size: 24px; 
            font-weight: 700; 
            color: #ff6b6b; 
            margin: 20px 0;
        }
        .remaining { 
            background-color: #1a1a1a; 
            border: 1px solid #333333; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 20px 0;
            color: #ffcc00;
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
            color: #cccccc; 
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
            <h2 style="margin-top: 0; color: #ff6b6b;">Critical Credit Alert</h2>
            <p>You've used <strong>${dailyUsed}</strong> out of <strong>${dailyCap}</strong> daily credits (<strong>${usagePercentage}%</strong>).</p>
            
            <div class="warning-box">
                <div class="usage">WARNING: Only ${remainingCredits} credits remaining today!</div>
                <p>Your daily credits reset at midnight UTC. You'll be back to full power tomorrow.</p>
            </div>
            
            <div class="remaining">
                <strong>Want more credits now?</strong><br>
                Invite a friend and get 50 bonus credits instantly.
            </div>
            
            <div style="text-align: center;">
                <a href="https://stefna.xyz" class="cta">Get More Credits</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent to: ${to}</p>
            <p>Stefna 2025 all rights reserved</p>
        </div>
    </div>
</body>
</html>`;
      text = `You've used ${dailyUsed} out of ${dailyCap} daily credits (${usagePercentage}%).

WARNING: You only have ${remainingCredits} credits remaining today!

Your daily credits reset at midnight UTC. You'll be back to full power tomorrow.

Want more credits now? Invite a friend and get 50 bonus credits instantly.

— The Stefna Team`;
    } else {
      subject = 'You\'re Running Low on Credits';
            html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credit Warning</title>
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
        }
        .info-box { 
            background-color: #1a1a1a; 
            border: 2px solid #333333; 
            border-radius: 8px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0;
        }
        .usage { 
            font-size: 24px; 
            font-weight: 700; 
            color: #ffffff; 
            margin: 20px 0;
        }
        .remaining { 
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
            color: #cccccc; 
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
            <h2 style="margin-top: 0; color: #ffffff;">Running Low on Credits</h2>
            <p>You've used <strong>${dailyUsed}</strong> out of <strong>${dailyCap}</strong> daily credits (<strong>${usagePercentage}%</strong>).</p>
            
            <div class="info-box">
                <div class="usage">${remainingCredits} Credits Remaining</div>
                <p>Just a heads-up — you're running low on credits for today.</p>
                <p>Your daily 30 credits reset at midnight UTC.</p>
            </div>
            
            <div class="remaining">
                <strong>Want more now?</strong><br>
                Invite a friend and get 50 bonus credits instantly.
            </div>
            
            <div style="text-align: center;">
                <a href="https://stefna.xyz" class="cta">Get More Credits</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent to: ${to}</p>
            <p>Stefna 2025 all rights reserved</p>
        </div>
    </div>
</body>
</html>`;
      text = `You've used ${dailyUsed} out of ${dailyCap} daily credits (${usagePercentage}%).

Just a heads-up — you're running low on credits for today.

You have ${remainingCredits} credits remaining. Your daily 30 credits reset at midnight UTC.

Want more now? Invite a friend and get 50 bonus credits instantly.

— The Stefna Team`;
    }
    
    await resend.emails.send({
      from: 'Stefna <hello@stefna.xyz>',
      to: [to],
      subject: subject,
      html: html,
      text: text
    });

    console.log(`📧 Low credit warning email sent to ${to}: ${usagePercentage}% usage (${dailyUsed}/${dailyCap})`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ok: true, 
        message: 'Credit warning email sent successfully',
        usagePercentage,
        dailyUsed,
        dailyCap,
        remainingCredits
      })
    };

  } catch (error) {
    console.error('❌ send-credit-warning error:', error);
    
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
