// netlify/functions/waitlist-signup.ts
import type { Handler } from '@netlify/functions';
import { q, qOne } from './_db';
import { Resend } from 'resend';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
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
    const { email, referralCode } = JSON.parse(event.body || '{}');
    
    if (!email) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    console.log('📧 [Waitlist] Processing signup for:', email);

    // Add to waitlist using database function
    const waitlistResult = await qOne(`
      SELECT add_to_waitlist($1, $2) as result
    `, [email.toLowerCase(), referralCode || null]);

    if (!waitlistResult) {
      throw new Error('Failed to add to waitlist');
    }

    const waitlistData = waitlistResult.result;
    console.log('✅ [Waitlist] User added:', waitlistData);

    // Send confirmation email
    await sendWaitlistConfirmationEmail(email, waitlistData);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Successfully joined the waitlist!',
        data: {
          email: waitlistData.email,
          referralCode: waitlistData.referral_code,
          position: waitlistData.position
        }
      })
    };

  } catch (error: any) {
    console.error('❌ [Waitlist] Signup error:', error);
    
    // Handle duplicate email gracefully
    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'You\'re already on the waitlist!',
          data: { email: email.toLowerCase() }
        })
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to join waitlist',
        details: error.message
      })
    };
  }
};

// Send waitlist confirmation email
async function sendWaitlistConfirmationEmail(email: string, waitlistData: any) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not configured');
    return;
  }

  const resend = new Resend(resendApiKey);
  
  const referralLink = `https://stefna.xyz/coming-soon?ref=${waitlistData.referral_code}`;
  
  const emailHtml = `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#000;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Stefna Waitlist</title>
  </head>
  <body style="background-color:#000; color:#fff; font-family:Arial, sans-serif; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:40px 20px; text-align:center;">
      <img src="https://stefna.xyz/logo.png" alt="Stefna Logo" style="max-width:40px; margin-bottom:40px; display:block; margin-left:auto; margin-right:auto;">

      <h1 style="font-size:20px; font-weight:bold; margin-bottom:16px;">You're on the Stefna Waitlist!</h1>
      
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Welcome to the future of AI photo transformation! You're now part of an exclusive group that will get early access to Stefna.
      </p>
      
      <div style="background-color:#111; padding:20px; border-radius:8px; margin:20px 0;">
        <p style="font-size:14px; margin:0; color:#fff;">
          <strong>Your Position:</strong> #${waitlistData.position}<br>
          <strong>Your Referral Code:</strong> ${waitlistData.referral_code}
        </p>
      </div>
      
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        <strong>Share your referral link and move up the list!</strong><br>
        The more friends you invite, the higher your priority when we launch.
      </p>
      
      <div style="text-align:center; margin:20px 0;">
        <a href="${referralLink}" style="background-color:#fff; color:#000; padding:15px 30px; border-radius:6px; text-decoration:none; display:inline-block; font-weight:600;">Share Your Link</a>
      </div>
      
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        We'll notify you as soon as Stefna is ready. Get ready to transform your photos with AI magic!
      </p>

      <p style="font-size:14px; color:#aaa; margin-top:40px;">Stefna<br><p style="margin:5px 0 0; font-size:12px; color:#888888; text-align:center;">
        If you didn't sign up, you can safely ignore this email.<br />
        &copy; 2025 Stefna. All rights reserved.
      </p>
    </div>
  </body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Stefna Waitlist <hello@stefna.xyz>',
      to: [email],
      subject: 'Welcome to the Stefna Waitlist! 🚀',
      html: emailHtml
    });

    if (error) {
      console.error('❌ [Waitlist] Email send failed:', error);
    } else {
      console.log('✅ [Waitlist] Confirmation email sent:', data?.id);
    }
  } catch (emailError) {
    console.error('❌ [Waitlist] Email error:', emailError);
  }
}
