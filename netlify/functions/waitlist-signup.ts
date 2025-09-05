import { Handler } from '@netlify/functions';
import { json } from './_lib/http';
import { q } from './_db';

const waitlistSignup: Handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return json({}, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { email } = JSON.parse(event.body || '{}');

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Add to waitlist
    const result = await q('SELECT add_to_waitlist($1)', [email]);
    const waitlistData = result[0];

    console.log(`✅ [Waitlist] New signup: ${email}`);

    // Send confirmation email
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Stefna <hello@stefna.xyz>',
          to: [email],
          subject: 'You\'re on the waitlist! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #fff; margin: 0;">Welcome to Stefna!</h1>
              </div>
              
              <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 15px 0; font-size: 16px;">Thanks for joining our waitlist! You're in position <strong>#${waitlistData.position}</strong>.</p>
                <p style="margin: 0; font-size: 14px; color: #ccc;">We'll notify you as soon as we launch. Get ready for AI-powered photo transformations!</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="font-size: 12px; color: #666; margin: 0;">Powered by AI • Coming Soon</p>
              </div>
            </div>
          `
        }),
      });

      if (resendResponse.ok) {
        console.log(`📧 [Waitlist] Confirmation email sent to: ${email}`);
      } else {
        console.error(`❌ [Waitlist] Failed to send email to: ${email}`);
      }
    } catch (emailError) {
      console.error('📧 [Waitlist] Email error:', emailError);
      // Don't fail the signup if email fails
    }

    return json({
      success: true,
      message: 'Successfully joined waitlist! Check your email for confirmation.',
      position: waitlistData.position
    });

  } catch (error: any) {
    console.error('💥 [Waitlist] Error:', error?.message || error);
    return json({ 
      error: 'Failed to join waitlist',
      message: error?.message || 'Unknown error occurred'
    }, { status: 500 });
  }
};

export { waitlistSignup as handler };