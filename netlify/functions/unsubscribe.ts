import type { Handler } from "@netlify/functions";
import { q, qOne } from './_db';
import { json } from './_lib/http';

// Unsubscribe function for email preferences
export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: ''
    };
  }

  try {
    let email: string;
    let emailType: string;

    if (event.httpMethod === 'GET') {
      // Handle unsubscribe from URL parameters
      const params = new URLSearchParams(event.queryStringParameters || '');
      email = params.get('email') || '';
      emailType = params.get('type') || '';
    } else if (event.httpMethod === 'POST') {
      // Handle unsubscribe from POST request
      const body = JSON.parse(event.body || '{}');
      email = body.email || '';
      emailType = body.type || '';
    } else {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    if (!email || !emailType) {
      return json({ error: 'Email and type are required' }, { status: 400 });
    }

    console.log(`📧 [Unsubscribe] Processing unsubscribe request: ${email} - ${emailType}`);

    // Find user by email
    const user = await qOne(`
      SELECT id, email FROM users WHERE email = $1
    `, [email.toLowerCase()]);

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Update email preferences to unsubscribe
    await q(`
      INSERT INTO email_preferences (user_id, email_type, is_unsubscribed, updated_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (user_id, email_type)
      DO UPDATE SET 
        is_unsubscribed = true,
        updated_at = NOW()
    `, [user.id, emailType]);

    console.log(`✅ [Unsubscribe] User ${user.id} unsubscribed from ${emailType} emails`);

    // Return success response
    if (event.httpMethod === 'GET') {
      // For GET requests, return HTML page
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        },
        body: `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background-color:#000;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribed - Stefna</title>
  </head>
  <body style="background-color:#000; color:#fff; font-family:Arial, sans-serif; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:40px 20px; text-align:center;">
      <img src="https://stefna.xyz/logo.png" alt="Stefna Logo" style="max-width:40px; margin-bottom:40px; display:block; margin-left:auto; margin-right:auto;">
      
      <h1 style="font-size:20px; font-weight:bold; margin-bottom:16px;">You're Unsubscribed</h1>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        You've successfully unsubscribed from ${emailType} emails.
      </p>
      <p style="font-size:13px; line-height:1.6; margin:0 auto; max-width:90%;">
        You can still use Stefna normally. If you change your mind, you can resubscribe anytime.
      </p>
      
      <p style="font-size:14px; color:#aaa; margin-top:40px;">Stefna<br><p style="margin:5px 0 0; font-size:12px; color:#888888; text-align:center;">
        &copy; 2025 Stefna. All rights reserved.
      </p>
    </div>
  </body>
</html>`
      };
    } else {
      // For POST requests, return JSON
      return json({
        success: true,
        message: `Successfully unsubscribed from ${emailType} emails`,
        email: email.toLowerCase(),
        type: emailType
      });
    }

  } catch (error) {
    console.error('❌ [Unsubscribe] Error:', error);
    return json({ 
      error: 'Failed to process unsubscribe request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
