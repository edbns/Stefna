import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';

// Universal email function that handles all email types
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, text, html, type, data } = JSON.parse(event.body || '{}');
    
    if (!to || !subject) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email address and subject are required' })
      };
    }

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
    
    // Generate HTML content based on type if not provided
    let emailHtml = html;
    if (!emailHtml && type) {
      emailHtml = generateEmailTemplate(type, subject, text || '', { ...data, to: to });
    }
    
    // Fallback to universal template if no HTML provided
    if (!emailHtml) {
      emailHtml = generateUniversalTemplate(subject, text || '');
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Stefna <hello@stefna.xyz>',
      to: [to],
      subject: subject,
      html: emailHtml,
      text: text // Include plain text version
    });

    if (emailError) {
      console.error('Email send failed:', emailError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Failed to send email',
          details: emailError.message
        })
      };
    }

    console.log('✅ Email sent successfully:', emailData?.id);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: emailData?.id
      })
    };

  } catch (error) {
    console.error('Email send error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Generate email template based on type
function generateEmailTemplate(type: string, subject: string, text: string, data: any): string {
  const baseTemplate = `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#000;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefna Email</title>
  </head>
  <body style="background-color:#000; color:#fff; font-family:Arial, sans-serif; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:40px 20px; text-align:center;">
      <img src="https://stefna.xyz/logo.png" alt="Stefna Logo" style="max-width:40px; margin-bottom:40px; display:block; margin-left:auto; margin-right:auto;">

      <h1 style="font-size:20px; font-weight:bold; margin-bottom:16px;">{{EMAIL_SUBJECT}}</h1>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        {{EMAIL_BODY}}
      </p>

      <p style="font-size:14px; color:#aaa; margin-top:40px;">Stefna<br><p style="margin:5px 0 0; font-size:12px; color:#888888; text-align:center;">
        If you didn't sign up, you can safely ignore this email.<br />
        &copy; 2025 Stefna. All rights reserved.
      </p>
    </div>
  </body>
</html>`;

  let emailBody = text;

  switch (type) {
    case 'otp':
      const otp = data?.otp || 'XXXXXX';
      emailBody = `Hello,

Your one-time login code is:

**${otp}**

This code will expire in 10 minutes.`;
      break;
    
    case 'welcome':
      emailBody = `Welcome!

Thanks for joining Stefna — where moments turn into masterpieces. You've got 30 free credits today to try our AI transformations.

Need help? Just reply to this email.

Let's create something amazing.

<br /><br />Don't want these emails? <a href="https://stefna.xyz/unsubscribe?email={{EMAIL}}&type=welcome" style="text-decoration:underline;color:#fff;">Unsubscribe</a>.`;
      break;
    
    case 'account_deleted':
      emailBody = `Hello,

This is to confirm that your Stefna account has been permanently deleted.

If this was a mistake, we're here to help — but your data has been fully removed for your privacy.

Thank you for being part of Stefna.`;
      break;
    
    case 'inactive_reminder':
      emailBody = `Hey there,

Just a quick reminder — your daily credits on Stefna have refreshed.

Come back and transform your next photo. It only takes a moment.

See what you can create → <a href="https://stefna.xyz" style="text-decoration:underline;color:#fff;">Stefna</a>

<br /><br />Don't want these emails? <a href="https://stefna.xyz/unsubscribe?email={{EMAIL}}&type=inactive_reminder" style="text-decoration:underline;color:#fff;">Unsubscribe</a>.`;
      break;
    
    case 'referral_bonus':
      emailBody = `Nice work!

You earned +50 credits for referring a friend to Stefna. They signed up and joined the fun.

Use your bonus now → <a href="https://stefna.xyz" style="text-decoration:underline;color:#fff;">Stefna</a>

<br /><br />Don't want these emails? <a href="https://stefna.xyz/unsubscribe?email={{EMAIL}}&type=referral_bonus" style="text-decoration:underline;color:#fff;">Unsubscribe</a>.`;
      break;
    
    case 'credits_low':
      emailBody = `Heads up — you're running low on credits.

Don't worry, they refresh daily. Want more? Invite a friend and earn bonus credits instantly.

Check your balance → <a href="https://stefna.xyz/profile" style="text-decoration:underline;color:#fff;">Stefna</a>

<br /><br />Don't want these emails? <a href="https://stefna.xyz/unsubscribe?email={{EMAIL}}&type=credit_warning" style="text-decoration:underline;color:#fff;">Unsubscribe</a>.`;
      break;
    
    case 'referral':
      emailBody = `Hey there,

Your friend invited you to try Stefna — the AI photo transformation studio that turns any selfie or Photo into cinematic magic.

Join now and you'll receive +25 free credits to get started right away.

Claim your credits here:
<a href="https://stefna.xyz/" style="text-decoration:underline;color:#fff;">Stefna</a>

No account? No problem. It takes seconds.

Let your creativity run wild — no limits.`;
      break;
    
    case 'waitlist_confirmation':
      emailBody = `Hello,

Thanks for joining the waitlist for Stefna – your AI-powered creative studio.

You'll be among the first to know when we open up access. From cinematic edits to anime reactions and glitchy transformations, Stefna is designed to help you turn any photo into stunning visual art.

We'll notify you as soon as it's your turn to enter.

Until then, stay inspired

<br />PS: You can follow us on social for early previews and feature drops`;
      break;
    
    case 'waitlist_launch':
      emailBody = `Hello,

Great news! Stefna is now live and ready for you to explore.

From cinematic edits to anime reactions and glitchy transformations, your AI-powered creative studio is waiting.

Start creating now → <a href="https://stefna.xyz" style="text-decoration:underline;color:#fff;">Stefna</a>

Welcome to the future of AI creativity!

Stefna Team`;
      break;
    
    default:
      emailBody = text;
  }

  return baseTemplate
    .replace('{{EMAIL_SUBJECT}}', subject)
    .replace('{{EMAIL_BODY}}', emailBody)
    .replace('{{EMAIL}}', data?.to || '');
}

// Generate universal template for any email
function generateUniversalTemplate(subject: string, text: string): string {
  return `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#000;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stefna Email</title>
  </head>
  <body style="background-color:#000; color:#fff; font-family:Arial, sans-serif; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:40px 20px; text-align:center;">
      <img src="https://stefna.xyz/logo.png" alt="Stefna Logo" style="max-width:40px; margin-bottom:40px; display:block; margin-left:auto; margin-right:auto;">

      <h1 style="font-size:20px; font-weight:bold; margin-bottom:16px;">${subject}</h1>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        ${text}
      </p>

      <p style="font-size:14px; color:#aaa; margin-top:40px;">Stefna<br><p style="margin:5px 0 0; font-size:12px; color:#888888; text-align:center;">
        If you didn't sign up, you can safely ignore this email.<br />
        &copy; 2025 Stefna. All rights reserved.
      </p>
    </div>
  </body>
</html>`;
}
