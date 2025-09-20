// netlify/functions/send-referral-invite.ts
// CACHE BUSTER: 2025-01-20 - Force function cache invalidation
import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email address and referrer email are required' })
      };
    }

    // Get client IP for abuse prevention
    const clientIP = event.headers['x-forwarded-for'] || 
                    event.headers['x-real-ip'] || 
                    event.headers['x-client-ip'] || 
                    'unknown';

    // Find referrer by email
    const { q } = await import('./_db');
    const referrer = await q(`
      SELECT id FROM users WHERE email = $1
    `, [referrerEmail]);
    
    if (!referrer || referrer.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Referrer not found' })
      };
    }
    
    const referrerId = referrer[0].id;

    // Comprehensive referral validation
    const validationResult = await q(`
      SELECT * FROM validate_referral_request($1, $2, $3)
    `, [referrerId, to, clientIP]);
    
    const validation = validationResult[0];
    if (!validation.is_valid) {
      console.log('🚫 [Referral Invite] Validation failed:', validation.error_message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'REFERRAL_VALIDATION_FAILED',
          message: validation.error_message 
        })
      };
    }

    // Log referral attempt
    await q(`
      INSERT INTO referral_attempts (referrer_id, attempt_type, referred_email, ip_address, created_at)
      VALUES ($1, 'email_sent', $2, $3, NOW())
    `, [referrerId, to, clientIP]);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    const resend = new Resend(resendApiKey);
    
    await resend.emails.send({
      from: 'Stefna <hello@stefna.xyz>',
      to: [to],
      subject: 'Your Friend Invited You to Try Stefna',
            html: `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#000;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefna Invitation</title>
  </head>
  <body style="background-color:#000; color:#fff; font-family:Arial, sans-serif; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:40px 20px; text-align:center;">
      <img src="https://stefna.xyz/logo.png" alt="Stefna Logo" style="max-width:40px; margin-bottom:40px; display:block; margin-left:auto; margin-right:auto;">

      <h1 style="font-size:20px; font-weight:bold; margin-bottom:16px;">Your Friend Invited You to Try Stefna</h1>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Hey there,
      </p>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Your friend invited you to try Stefna — the AI photo transformation studio that turns any selfie or Photo into cinematic magic.
      </p>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Join now and you'll receive +10 free credits to get started right away.
      </p>
      
      <div style="text-align:center; margin:20px 0;">
        <a href="https://stefna.xyz/auth?referrer=${referrerEmail}" style="background-color:#fff; color:#000; padding:15px 30px; border-radius:6px; text-decoration:none; display:inline-block; font-weight:600;">Claim your credits here</a>
      </div>
      
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        No account? Get one. It only takes seconds.
      </p>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Let your creativity run wild — no limits.
      </p>

      <p style="font-size:14px; color:#aaa; margin-top:40px;">Stefna<br><p style="margin:5px 0 0; font-size:12px; color:#888888; text-align:center;">
        If you didn't sign up, you can safely ignore this email.<br />
        &copy; 2025 Stefna. All rights reserved.
      </p>
    </div>
  </body>
</html>`,
      text: `Someone invited you to try Stefna — a new way to create high-quality AI images (and soon, videos).

As a referred user, you get 10 bonus credits the moment you sign up.

No subscriptions, no verification, just creative freedom with a daily 14 credit limit for everyone.

Use your 10 extra credits however you like — on top of your daily allowance.

Join now and start creating:

Click Here: https://stefna.xyz/auth?referrer=${referrerEmail}

No account? Get one. It only takes seconds.

— The Stefna Team`
    });

        return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
