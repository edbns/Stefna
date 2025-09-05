// netlify/functions/waitlist-launch.ts
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check admin authentication
    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    console.log('🚀 [Waitlist Launch] Starting launch notification process...');

    // Get all waiting users
    const waitingUsers = await q(`
      SELECT email, referral_code, position
      FROM waitlist
      WHERE status = 'waiting'
      ORDER BY position ASC
    `);

    if (!waitingUsers || waitingUsers.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'No waiting users found',
          notifiedCount: 0
        })
      };
    }

    console.log(`📧 [Waitlist Launch] Notifying ${waitingUsers.length} users...`);

    // Send launch emails to all waiting users
    const results = await Promise.allSettled(
      waitingUsers.map(user => sendLaunchEmail(user.email, user.referral_code, user.position))
    );

    // Count successful sends
    const successfulSends = results.filter(result => result.status === 'fulfilled').length;
    const failedSends = results.filter(result => result.status === 'rejected').length;

    // Update status in database
    const updateResult = await qOne(`
      SELECT notify_waitlist_launch() as result
    `);

    console.log(`✅ [Waitlist Launch] Completed: ${successfulSends} successful, ${failedSends} failed`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Launch notifications sent',
        stats: {
          totalUsers: waitingUsers.length,
          successfulSends,
          failedSends,
          databaseUpdate: updateResult?.result
        }
      })
    };

  } catch (error: any) {
    console.error('❌ [Waitlist Launch] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to send launch notifications',
        details: error.message
      })
    };
  }
};

// Send launch notification email
async function sendLaunchEmail(email: string, referralCode: string, position: number) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const resend = new Resend(resendApiKey);
  
  const signupLink = `https://stefna.xyz/auth?ref=${referralCode}`;
  const referralLink = `https://stefna.xyz/auth?ref=${referralCode}`;
  
  const emailHtml = `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#000;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefna is Live! 🚀</title>
  </head>
  <body style="background-color:#000; color:#fff; font-family:Arial, sans-serif; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:40px 20px; text-align:center;">
      <img src="https://stefna.xyz/logo.png" alt="Stefna Logo" style="max-width:40px; margin-bottom:40px; display:block; margin-left:auto; margin-right:auto;">

      <h1 style="font-size:24px; font-weight:bold; margin-bottom:16px;">🚀 Stefna is Live!</h1>
      
      <p style="font-size:16px; line-height:1.6; margin:0 auto; max-width:90%; font-weight:600;">
        The wait is over! Stefna is now live and ready to transform your photos with AI magic.
      </p>
      
      <div style="background-color:#111; padding:20px; border-radius:8px; margin:20px 0;">
        <p style="font-size:14px; margin:0; color:#fff;">
          <strong>Your Waitlist Position:</strong> #${position}<br>
          <strong>Your Referral Code:</strong> ${referralCode}<br>
          <strong>Bonus Credits:</strong> +50 for being on the waitlist!
        </p>
      </div>
      
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        <strong>What's waiting for you:</strong><br>
        • Transform photos with AI (Neo Tokyo Glitch, Ghibli reactions, Emotion masks)<br>
        • 30 free credits to start + 50 bonus credits<br>
        • Refer friends and earn more credits<br>
        • Share your creations on social media
      </p>
      
      <div style="text-align:center; margin:30px 0;">
        <a href="${signupLink}" style="background-color:#fff; color:#000; padding:18px 40px; border-radius:8px; text-decoration:none; display:inline-block; font-weight:600; font-size:16px;">Start Creating Now</a>
      </div>
      
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        <strong>Share with friends:</strong><br>
        Use your referral link to invite others and earn bonus credits when they sign up!
      </p>
      
      <div style="text-align:center; margin:20px 0;">
        <a href="${referralLink}" style="background-color:#333; color:#fff; padding:12px 25px; border-radius:6px; text-decoration:none; display:inline-block; font-weight:500;">Share Referral Link</a>
      </div>
      
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        Thank you for being part of our journey. Let's create something amazing together!
      </p>

      <p style="font-size:14px; color:#aaa; margin-top:40px;">Stefna<br><p style="margin:5px 0 0; font-size:12px; color:#888888; text-align:center;">
        If you didn't sign up for the waitlist, you can safely ignore this email.<br />
        &copy; 2025 Stefna. All rights reserved.
      </p>
    </div>
  </body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: 'Stefna <hello@stefna.xyz>',
    to: [email],
    subject: '🚀 Stefna is Live! Your Early Access is Ready',
    html: emailHtml
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  console.log(`✅ [Waitlist Launch] Email sent to ${email}:`, data?.id);
  return data;
}
